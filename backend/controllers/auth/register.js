const { clientModel, userModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const bcrypt = require("bcrypt");
const { setUserVerification } = require("../../utils/mailSender");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const {
  registerSchema,
  storeOwnerSpecificRegister,
} = require("../../validations/auth");
const { mergeGuestCartWithUserCart } = require("../../utils/cartMergeHelper");

const registerController = async (req, res) => {
  try {
    const parsedRegister = registerSchema.safeParse(req.body);
    if (!parsedRegister.success) {
      return res
        .status(400)
        .json({ message: parsedRegister.error.issues[0].message });
    }

    const { role, username, email, password, session_id, ...otherData } =
      // parsedRegister.data || 
      req.body;

    let parsedStoreOwnerRegister;
    if (role === "store_owner") {
      parsedStoreOwnerRegister = storeOwnerSpecificRegister.safeParse(req.body);
      if (!parsedStoreOwnerRegister.success) {
        return res
          .status(400)
          .json({ message: parsedStoreOwnerRegister.error.issues[0].message });
      }
    }

    const existingUser = await userModel.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "username or email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;
    const commonData = {
      username,
      email,
      password: hashedPassword,
      phoneNumber: otherData.phoneNumber || null,
      birthdate: otherData.birthdate || null,
      gender: otherData.gender || null,
      address: otherData.address || null,
    };

    if (role === "client") {
      newUser = await clientModel.create({ ...commonData });
    }

    if (role === "store_owner") {
      if (!parsedStoreOwnerRegister) {
        return res
          .status(400)
          .json({ message: "store owner account validations failed!" });
      }
      newUser = await storeOwnerModel.create({
        ...commonData,
        ...parsedStoreOwnerRegister.data,
        is_approved: false,
        isActive: false,
      });
    }

    //temporary to seed the original admin into mongodb
    // if(role === "admin")
    //   newUser = await adminModel.create({ ...commonData, permission: otherData.permission, createdBy: otherData.createdBy});

    if (!newUser) {
      return res.status(400).json({ message: "user account not created!" });
    }

    // MERGE CART ONLY DURING REGISTRATION if session_id is provided and user is client
    let cartMergeResult = null;
    if (session_id && role === "client") {
      cartMergeResult = await mergeGuestCartWithUserCart(
        newUser._id,
        session_id,
      );
    //  console.log("Cart merge result during registration:", cartMergeResult);
    }
  //====MERGE CART ONLY DURING LOGIN if session_id is provided===//
    const { accessToken, refreshToken } = setAccessRefreshTokens(
      res,
      newUser,
      false,
    );
    
    setUserVerification(newUser, "10m");

    res.status(201).json({
      message: cartMergeResult?.merged
        ? "Account created successfully! Guest cart merged with your new account. Verification link sent to your email."
        : "Verification link sent to your email to activate your created account!",
      user: newUser,
      accessToken,
      refreshToken,
      cart_merged: cartMergeResult?.merged || false,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error!", error: error.message });
  }
};

module.exports = registerController;
