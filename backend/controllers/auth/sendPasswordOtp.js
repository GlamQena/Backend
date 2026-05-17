const userModel = require("../../models/users/user");
const otpModel = require("../../models/auth-temps/otp");
const { sendEmailMessage } = require("../../utils/mailSender");

const sendPasswordOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpObject = await otpModel.findOne({
      userId: user._id,
      for: "resetPassword",
    });

    if (otpObject) {
      otpObject.otpCode = otp;
      otpObject.isActive = true;
      otpObject.isVerified = false;
      otpObject.otpExpiry = Date.now() + 10 * 60 * 1000;
      otpObject.otpAttempts = 0;
      await otpObject.save();
    } else {
      otpModel.create({
        userId: user._id,
        for: "resetPassword",
        otpCode: otp,
        isActive: true,
      });
    }

    sendEmailMessage({
      to: email,
      subject: "Password Reset Code",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to your email..." });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "internal server error!", error: e.message });
  }
};

module.exports = sendPasswordOtpController;
