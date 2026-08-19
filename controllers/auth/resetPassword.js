const otpModel = require("../../models/auth-temps/otp");
const userModel = require("../../models/users/user");
const {resetPasswordSchema}= require("../../validations/auth");
const bcrypt= require("bcrypt");

const resetPasswordController = async (req, res) => {
  try{

    const { email, newPassword, confirmNewPassword } = req.body;

    if(!email || !newPassword || !confirmNewPassword)
      return res.status(400).json({message: "you must provide email, newPassword and confirmNewPassword"});

    const parsedResetPassSchema= resetPasswordSchema.safeParse({newPassword, confirmNewPassword});
    if(!parsedResetPassSchema.success){
      return res.status(400).json({message: parsedResetPassSchema.error.issues[0].message});
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "your account doesn't exist!" });
    }
    const otpObject = await otpModel.findOne({ userId: user._id , for: "resetPassword"});
    if (!otpObject) {
      return res.status(400).json({ message: "Expirated OTP" });
    }
    if (!otpObject.isVerified) {
      return res.status(400).json({ message: "Unverified OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    otpObject.isVerified = false;

    await user.save();
    await otpObject.save();

    res.status(200).json({ message: "Password updated successfully..." });

  }catch(error){
    res.status(500).json({message: "failed to reset the password", error: error.message});
  }
};

module.exports = resetPasswordController;
