const userModel = require("../../models/users/user");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const { mergeGuestCartWithUserCart } = require("../../utils/cartMergeHelper");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client();

const GOOGLE_CLIENT_ID =
  "526568342272-d3a3k4i7josdkd360drqead1vn3g0t0a.apps.googleusercontent.com";

const USERNAME_REGEX = /^[a-z0-9_]{3,64}$/;

async function generateUniqueUsername({ email, name, googleId }) {
  let base =
    (email && email.split("@")[0]) ||      // prefer email local-part
    (name && name.trim()) ||               // fall back to display name
    `user_${googleId.slice(0, 8)}`;        // final fallback: deterministic

  base = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")   // anything not allowed → underscore
    .replace(/_+/g, "_")           // collapse runs of underscores
    .replace(/^_+|_+$/g, "");      // trim leading/trailing underscores

  if (base.length < 3) base = `user_${base}`.slice(0, 64);
  if (base.length > 64) base = base.slice(0, 64);

  if (USERNAME_REGEX.test(base)) {
    const exists = await userModel.exists({ username: base });
    if (!exists) return base;
  }

  // Otherwise append a numeric suffix until unique.
  //  Reserve room for up to 5 digits.
  const stem = base.slice(0, 59); // 64 - 5 = 59
  for (let i = 0; i < 10000; i++) {
    const candidate = `${stem}${i}`;
    if (!USERNAME_REGEX.test(candidate)) continue;
    const exists = await userModel.exists({ username: candidate });
    if (!exists) return candidate;
  }

  // Extremely unlikely fallback: use the googleId itself (guaranteed unique).
  return `user_${googleId}`.slice(0, 64);
}

const googleSignController = async (req, res) => {
  try {
    const { platform } = req.query;
    const { idToken, session_id } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken is required",
      });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn("Google token verification failed:", verifyErr.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google token",
      });
    }

    const { sub, email, email_verified, name, picture } = payload;

    // Path A: user already linked to this Google account.
    let user = await userModel.findOne({ googleId: sub });
    let created = false;

    // Path B: user registered with email/password earlier, now signing in
    // with Google for the first time. Link the accounts.
    if (!user && email) {
      const emailUser = await userModel.findOne({ email });
      if (emailUser) {
        emailUser.googleId = sub;
        emailUser.authProvider =
          emailUser.authProvider === "local" ? "both" : emailUser.authProvider;
        if (email_verified && !emailUser.isEmailVerified) {
          emailUser.isEmailVerified = true;
        }
        if (picture && !emailUser.avatar) {
          emailUser.avatar = picture;
        }
        await emailUser.save();
        user = emailUser;
      }
    }

    // Path C: brand-new user via Google.
    if (!user) {
      const username = await generateUniqueUsername({ email, name, googleId: sub });

      user = await userModel.create({
        googleId: sub,
        email: email ?? undefined,
        username,
        isEmailVerified: Boolean(email_verified),
        authProvider: "google",
        ...(picture ? { avatar: picture } : {}),
      });
      created = true;
    }

    let cartMergeResult = null;
    if (session_id && user.role === "client") {
      cartMergeResult = await mergeGuestCartWithUserCart(user._id, session_id);
    }

    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
      setAccessRefreshTokens(res, user, false, platform);

    const userData = user.toObject();
    delete userData.password;

    const statusCode = created ? 201 : 200;
    const baseMessage = created
      ? "user account created successfully"
      : "user loggedIn successfully";

    return res.status(statusCode).json({
      success: true,
      message: cartMergeResult?.merged
        ? `${baseMessage}. Guest cart merged with your account.`
        : baseMessage,
      user: userData,
      accessToken,
      refreshToken,
      accessTokenExp,
      refreshTokenExp,
      cart_merged: cartMergeResult?.merged || false,
    });
  } catch (ex) {
    console.error("Error signing in with Google:", ex);

    // Duplicate-key race (two concurrent signups with same email/username).
    if (ex?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Account conflict. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = googleSignController;