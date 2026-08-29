const { userModel } = require("../../models/users/user");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const otpModel = require("../../models/auth-temps/otp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const jwtVerify = promisify(jwt.verify);

const activateAccountController = async (req, res) => {
  try {
    const { email, token, activationCode, newPassword, confirmPassword, rememberMe } = req.body;

    if (!email || !token || !activationCode || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: email, token, activationCode, newPassword, confirmPassword"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    let decodedToken;
    try {
      decodedToken = await jwtVerify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired activation token. Please request a new one."
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email"
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account is already active. Please login normally."
      });
    }

    if (decodedToken.id.toString() !== user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Invalid token for this user"
      });
    }

    if (!["admin", "store_owner"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Activation is only for admin and store owner accounts"
      });
    }

    const foundCode = await otpModel.findOne({
      userId: user._id,
      for: "activateAccount",
      isActive: true
    });

    if (!foundCode) {
      return res.status(400).json({
        success: false,
        message: "No active activation code found. Please request a new one."
      });
    }

    if (foundCode.otpExpiry < Date.now()) {
      foundCode.isActive = false;
      await foundCode.save();
      return res.status(400).json({
        success: false,
        message: "Activation code has expired. Please request a new one."
      });
    }

    // Check if OTP is already verified (used)
    if (foundCode.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This activation code has already been used. Please request a new one."
      });
    }

    // Check if the entered code matches the stored code
    if (foundCode.otpCode !== activationCode) {
      // WRONG CODE: Increment attempts
      foundCode.otpAttempts += 1;
      
      // Check if max attempts exceeded
      if (foundCode.otpAttempts >= 3) {
        foundCode.isActive = false;
        await foundCode.save();
        return res.status(400).json({
          success: false,
          message: "Maximum attempts exceeded. Please request a new activation code.",
          attemptsRemaining: 0
        });
      }
      
      await foundCode.save();
      
      return res.status(400).json({
        success: false,
        message: `Invalid activation code. ${3 - foundCode.otpAttempts} attempts remaining.`,
        attemptsRemaining: 3 - foundCode.otpAttempts
      });
    }

    // CORRECT CODE: Proceed with activation
    foundCode.isVerified = true;
    foundCode.isActive = false;
    await foundCode.save();

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Activate user and set password
    user.password = hashedPassword;
    user.isActive = true;
    user.isEmailVerified = true;
    await user.save();

    // Update role-specific model
    if (user.role === "store_owner") {
      await storeOwnerModel.findByIdAndUpdate(user._id, {
        isActive: true,
        is_approved: true
      });
    } else if (user.role === "admin") {
      await adminModel.findByIdAndUpdate(user._id, {
        isActive: true
      });
    }

    const userData = user.toObject();
    delete userData.password;

    const { accessToken, refreshToken } = setAccessRefreshTokens(
      res,
      user,
      rememberMe || false
    );

    res.status(200).json({
      success: true,
      message: "Account activated successfully! Welcome aboard.",
      user: userData,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error("Error in activateAccount:", error);
    res.status(500).json({
      success: false,
      message: "Account activation failed",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

module.exports = activateAccountController;