const userModel = require("../../models/users/user");
const otpModel = require("../../models/auth-temps/otp");

const verifyPasswordOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpObject = await otpModel.findOne({ userId: user._id, for: "resetPassword" });

    if (
      !otpObject ||
      !otpObject.isActive ||
      otpObject.otpExpiry < Date.now() ||
      otpObject.isVerified
    ) {
      return res.status(400).json({ message: "Expirated OTP" });
    }

    if (otpObject.otpCode !== otp) {
      otpObject.otpAttempts++;
      await otpObject.save();
      if (otpObject.otpAttempts == 3) {
        otpObject.isActive = false;
        await otpObject.save();
        return res.status(400).json({ message: "Game Over" });
      }
      else if(otpObject.otpAttempts == 2){
        return res.status(400).json({ message: "Invalid OTP and You have one more chance" });
      }
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpObject.isActive = false;
    otpObject.isVerified = true;
    await otpObject.save();

    res.json({ message: "OTP verified" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = verifyPasswordOtpController;
