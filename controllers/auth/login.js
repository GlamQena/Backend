const { clientModel, userModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const { loginSchema } = require("../../validations/auth");
const { mergeGuestCartWithUserCart } = require("../../utils/cartMergeHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpModel = require("../../models/auth-temps/otp");
const { sendEmailMessage } = require("../../utils/mailSender");
const { promisify } = require("util");
const jwtVerify = promisify(jwt.verify);

// loginController.js - Pure login logic
const loginController = async (req, res) => {
  try {
    const { usernameOrEmail, password, rememberMe, session_id } = req.body;

    // Validate input
    const validated = loginSchema.safeParse({ usernameOrEmail, password });
    if (!validated.success) {
      return res.status(400).json({ 
        success: false,
        message: validated.error.issues[0].message 
      });
    }

    // Find user
    const user = await userModel
      .findOne({
        $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or username" 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Check password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // Merge guest cart for clients
    let cartMergeResult = null;
    if (session_id && user.role === "client") {
      cartMergeResult = await mergeGuestCartWithUserCart(user._id, session_id);
    }

    // Generate tokens
    const userData = user.toObject();
    delete userData.password;

    const { accessToken, refreshToken } = setAccessRefreshTokens(
      res,
      user,
      rememberMe
    );

    res.status(200).json({
      success: true,
      message: cartMergeResult?.merged
        ? "Login successful. Guest cart merged with your account."
        : "Login successful",
      user: userData,
      accessToken,
      refreshToken,
      cart_merged: cartMergeResult?.merged || false,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

module.exports = loginController;