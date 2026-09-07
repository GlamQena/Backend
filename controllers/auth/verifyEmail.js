const jwt = require("jsonwebtoken");
const userModel = require("../../models/users/user");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");

const verifyEmailController = async (req, res) => {
  try {
    const { email, token } = req.params;

    const user = await userModel.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: {
          email: ["No user exists with this email."],
        },
      });
    }

    // Verify token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Check if it's an expiration error
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: "Token has expired. Please request a new verification email.",
          errors: {
            token: ["The verification link has expired."]
          }
        });
      }
      // Other JWT errors
      return res.status(400).json({
        success: false,
        message: "Invalid token",
        errors: {
          token: ["The verification link is invalid."]
        }
      });
    }

    if (decoded.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Token does not match email",
        errors: {
          token: ["Invalid token for this email."],
        },
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
        errors: {
          email: ["This email is already verified."],
        },
      });
    }

    user.isEmailVerified = true;
    if (user.role === "store_owner" && email === user.store_email) {
      user.isStoreEmailVerified = true;
    }

    await user.save();

    // Remove password from user object
    const userData = user.toObject();
    delete userData.password;

    const { accessToken, refreshToken } = setAccessRefreshTokens(res, user, false);

    const authData = {
      user: userData,
      accessToken,
      refreshToken,
    };

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      authData: authData,
    });

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = verifyEmailController;