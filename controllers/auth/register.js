const { clientModel, userModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const bcrypt = require("bcrypt");
const { setUserVerification } = require("../../utils/mailSender");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const {
  registerSchema,
  storeOwnerSpecificRegister,
} = require("../../validations/auth");
const { mergeGuestCartWithUserCart } = require("../../utils/cartMergeHelper");

// ── Compose the store-owner schema once, at module load ──
const storeOwnerRegisterSchema = registerSchema.safeExtend(
  storeOwnerSpecificRegister.shape,
);

const PUBLIC_REGISTER_ROLES = new Set(["client", "store_owner"]);

const registerController = async (req, res) => {
  try {
    const { platform } = req.query;
    const { session_id, role: rawRole } = req.body;

    const role = typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";

    if (!PUBLIC_REGISTER_ROLES.has(role)) {
      return res.status(400).json({
        message: "role must be either client or store_owner",
      });
    }

    // ── Select the schema based on the validated role ──
    const schema = role === "store_owner" ? storeOwnerRegisterSchema : registerSchema;

    const parsed = schema.safeParse({ ...req.body, role });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const {
      username,
      email,
      password,
      // optional fields
      phoneNumber,
      birthdate,
      gender,
      address,
      preferences,
      // store-owner-only fields (undefined for clients)
      store_name,
      store_email,
      store_phone,
      store_address,
    } = parsed.data;

    // ── Uniqueness check (username or email already in use) ──
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "username or email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const commonData = {
      username,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber ?? null,
      birthdate: birthdate ?? null,
      gender: gender ?? null,
      address: address ?? null,
    };

    if (preferences !== undefined) {
      commonData.preferences = preferences;
    }

    let newUser;

    if (role === "client") {
      newUser = await clientModel.create(commonData);
    } else if (role === "store_owner") {
      newUser = await storeOwnerModel.create({
        ...commonData,
        store_name,
        store_email,
        store_phone,
        store_address,
        is_approved: false,
        isActive: false,
      });
    } else {
      // Unreachable given the guard above; kept as a defensive fallback.
      return res.status(400).json({ message: "invalid role" });
    }

    if (!newUser) {
      return res.status(400).json({ message: "user account not created!" });
    }

    // ── Merge guest cart for clients with a session ──
    let cartMergeResult = null;
    if (session_id && role === "client") {
      cartMergeResult = await mergeGuestCartWithUserCart(newUser._id, session_id);
    }

    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
      setAccessRefreshTokens(res, newUser, false, platform);

    // ── Send verification email (awaited so failures are caught) ──
    await setUserVerification(newUser, "10m", platform);

    const authData = {
      user: newUser,
      accessToken,
      refreshToken,
      accessTokenExp,
      refreshTokenExp,
    };

    return res.status(201).json({
      message: cartMergeResult?.merged
        ? "Account created successfully! Guest cart merged with your new account. Verification link sent to your email."
        : "Verification link sent to your email to activate your created account!",
      cart_merged: cartMergeResult?.merged || false,
      // Store owners don't get auth tokens in the response because they can't
      // log in until an admin approves them (is_approved=false). Clients do.
      authData: role !== "store_owner" ? authData : null,
    });
  } catch (error) {
    console.error("exception occurred while registering:", error);
    return res.status(500).json({
      message: "internal server error!",
      error: error.message,
    });
  }
};

module.exports = registerController;