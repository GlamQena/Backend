const userModel = require("../../models/users/user");
const otpModel = require("../../models/auth-temps/otp");
const nodemailer = require("nodemailer");
const sendEmailOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpObject = await otpModel.findOne({ userId: user._id });

    if (otpObject) {
      otpObject.for = "verifyEmail";
      otpObject.otpCode = otp;
      otpObject.isActive = true;
      otpObject.isVerfied = false;
      otpObject.otpExpiry = Date.now() + 10 * 60 * 1000;
      otpObject.otpAttempts = 0;
      await otpObject.save();
    } else {
      otpModel.insertOne({
        userId: user._id,
        for: "verifyEmail",
        otpCode: otp,
        isActive: true,
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Code",
      html: `<h2>Your OTP is: ${otp}</h2>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = sendEmailOtpController;
