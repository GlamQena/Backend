const { clientModel, userModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const { loginSchema } = require("../../validations/auth");
const { mergeGuestCartWithUserCart } = require("../../utils/cartMergeHelper");
const bcrypt = require('bcrypt');

const loginController = async (req, res) => {
  try {
    const { usernameOrEmail, password, rememberMe, session_id } = req.body;

    const validatedLoginSchema = loginSchema.safeParse({ usernameOrEmail, password });
    if (!validatedLoginSchema.success) {
      return res.status(400).json({ message: validatedLoginSchema.error.issues[0].message });
    }

    const user = await userModel.findOne({ $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }] }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or username" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // MERGE CART ONLY DURING LOGIN if session_id is provided
    let cartMergeResult = null;
    if (session_id) {
      cartMergeResult = await mergeGuestCartWithUserCart(user._id, session_id);
     console.log("Cart merge result during login:", cartMergeResult);
    
    }
    //====MERGE CART ONLY DURING LOGIN if session_id is provided===//

    let userData;
    if (user.role === "client") {
      userData = await clientModel.findOne({ _id: user._id }).select("-password").lean();
    }

    if (user.role === "store_owner") {
      userData = await storeOwnerModel.findOne({ _id: user._id }).select("-password").lean();
    }

    const { accessToken, refreshToken } = setAccessRefreshTokens(res, user, rememberMe);

    res.status(200).json({
      message: cartMergeResult?.merged ? "Login successful. Guest cart merged with your account." : "Successful login...",
      user: userData,
      accessToken,
      refreshToken,
      cart_merged: cartMergeResult?.merged || false,
    });

  } catch (error) {
    res.status(500).json({ message: "internal server error", error: error.message });
  }
};

module.exports = loginController;