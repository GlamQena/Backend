const jwt= require("jsonwebtoken");
const userModel = require("../../models/users/user");
const {setAccessRefreshTokens}= require("../../utils/acc_ref_tokens");

const verifyEmailController = async (req, res) => {
  try {
    
    const { email, token } = req.params;

    const user = await userModel.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errors: {
          email: ["No user exists with this email."],
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({
        message: "Token does not match email",
        errors: {
          token: ["Invalid token for this email."],
        },
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email already verified",
        errors: {
          email: ["This email is already verified."],
        },
      });
    }

    user.isEmailVerified = true;
    if(user.role==="store_owner" && email===user.store_email)
      user.isStoreEmailVerified=true;

    await user.save();

    if(user.password)
      delete user["password"];
    
    await setAccessRefreshTokens(req, res, user, false);

    return res.status(200).json({
      message: "Email verified successfully",
      user
    });

  } catch (error) {
    
    return res.status(400).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

module.exports =  verifyEmailController ;