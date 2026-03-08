const otpModel = require("../../models/auth-temps/otp");
const userModel = require("../../models/users/user");

const resetPasswordController = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const otpObject = await otpModel.findOne({ userId: user._id });
  if (!otpObject) {
    return res.status(400).json({ message: "Expiated OTP" });
  }
  if (!otpObject.isVerfied) {
    return res.status(400).json({ message: "Expiated OTP" });
  }

  user.password = password;

  otpObject.isVerfied = false;

  await user.save();
  await otpObject.save();

  res.json({ message: "Password updated successfully" });
};

module.exports = resetPasswordController;
