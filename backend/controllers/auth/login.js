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

const loginController = async (req, res) => {
  try {
    const token = req.query.token || null;
    let { usernameOrEmail, password, activationCode, rememberMe, session_id } =
      req.body;

    // Validate input
    const validatedLoginSchema = loginSchema.safeParse({
      usernameOrEmail,
      password,
    });

    if (!validatedLoginSchema.success) {
      return res.status(400).json({ 
        success: false,
        message: validatedLoginSchema.error.issues[0].message 
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

    // Check password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // Handle first-time login for admin and store_owner
    const isFirstLogin = !user.isActive && (user.role === "admin" || user.role === "store_owner");
    let resetPassCodeCreated = false;
    
    if (isFirstLogin) {
      // Require token for first login
      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: "Activation token required for first-time login" 
        });
      }

      let decodedToken;
      try {
        decodedToken = await jwtVerify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.log("First login token invalid");
        return res.status(401).json({ 
          success: false,
          message: "Invalid or expired activation token" 
        });
      }

      const { id: user_id, role, email } = decodedToken;

      // Validate token matches user
      if (
        user_id.toString() !== user._id.toString() ||
        user.role !== role ||
        (role !== "admin" && role !== "store_owner")
      ) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid token for this user" 
        });
      }

      // Validate activation code
      if (!activationCode) {
        return res.status(400).json({ 
          success: false,
          message: "Activation code is required for first login" 
        });
      }

      activationCode = activationCode.trim();
      if (activationCode.length !== 6) {
        return res.status(400).json({ 
          success: false,
          message: "Activation code must be 6 digits" 
        });
      }

      // Verify activation code
      const foundCode = await otpModel.findOne({
        userId: user_id,
        otpCode: activationCode,
        for: "activateAccount",
      });

      if (!foundCode) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid activation code" 
        });
      }

      // Check if code is expired or already used
      if (foundCode.otpExpiry < Date.now()) {
        return res.status(400).json({ 
          success: false,
          message: "Activation code has expired. Please request a new one." 
        });
      }

      if (foundCode.isVerified) {
        return res.status(400).json({ 
          success: false,
          message: "Activation code already used" 
        });
      }

      if (!foundCode.isActive) {
        return res.status(400).json({ 
          success: false,
          message: "Activation code is no longer active" 
        });
      }

      // Increment attempts
      foundCode.otpAttempts += 1;
      
      if (foundCode.otpAttempts >= 3) {
        foundCode.isActive = false;
        await foundCode.save();
        return res.status(400).json({ 
          success: false,
          message: "Maximum attempts exceeded. Please request a new activation code." 
        });
      }

      // Mark as verified
      foundCode.isVerified = true;
      await foundCode.save();

      // Activate the user
      await userModel.findByIdAndUpdate(user_id, { isActive: true });

      // Generate reset password code
      const resetPassCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await otpModel.findOneAndUpdate(
        { userId: user_id, for: "resetPassword" },
        {
          otpCode: resetPassCode,
          otpAttempts: 0,
          isActive: true,
          isVerified: false,
          otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        },
        { upsert: true, new: true }
      );

      resetPassCodeCreated = true;

      // Send reset password email (non-blocking)
      sendEmailMessage({
        to: user.email,
        subject: "Set Your Password",
        text: `Welcome! Please set your password using this code: ${resetPassCode}\n\nThe code expires in 10 minutes.`,
      }).catch(err => console.error("Error sending reset password email:", err));

      // Return response with reset requirement (no access token yet)
      return res.status(200).json({
        success: true,
        message: "First login successful. Please set your password to continue.",
        requiresPasswordReset: true,
        userId: user._id,
        email: user.email
      });
    }

    // Regular login for active users
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Merge guest cart for clients
    let cartMergeResult = null;
    if (session_id && user.role === "client") {
      cartMergeResult = await mergeGuestCartWithUserCart(user._id, session_id);
      console.log("Cart merge result:", cartMergeResult);
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
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

module.exports = loginController;