const otpModel = require("../../models/auth-temps/otp");
const userModel = require("../../models/users/user");
const bcrypt= require("bcrypt");

const resetPasswordController = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "your account doesn't exist!" });
  }
  const otpObject = await otpModel.findOne({ userId: user._id });
  if (!otpObject) {
    return res.status(400).json({ message: "Expirated OTP" });
  }
  if (!otpObject.isVerified) {
    return res.status(400).json({ message: "Expirated OTP" });
  }

  if(password != confirmPassword)
    return res.status(400).json({message:"you entered unmatched passwords!"});

  user.password = await bcrypt.hash(password, 10);

  otpObject.isVerified = false;

  await user.save();
  await otpObject.save();

  res.status(200).json({ message: "Password updated successfully..." });
};

module.exports = resetPasswordController;
