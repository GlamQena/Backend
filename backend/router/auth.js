const registerController= require('../controllers/auth/register.js');
const loginController= require('../controllers/auth/login.js');
const sendEmailOtpController= require('../controllers/auth/sendEmailOtp.js');
const sendSmsOtpController= require('../controllers/auth/sendSmsOtp.js');
const verifyEmailOtpController= require('../controllers/auth/verifyEmailOtp.js');
const verifySmsOtpController= require('../controllers/auth/verifySmsOtp.js');
const resetPasswordController= require('../controllers/auth/resetPassword.js');
const logoutController= require('../controllers/auth/logout.js');

const express= require("express");


const router= express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/otp/email", sendEmailOtpController);
router.post("/otp/sms", sendSmsOtpController);
router.post("/verify/email", verifyEmailOtpController);
router.post("/verify/sms", verifySmsOtpController);
router.post("/reset-password", resetPasswordController);
router.delete("/logout", logoutController);

module.exports= router;