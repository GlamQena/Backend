const registerController= require('../controllers/auth/register.js');
const loginController= require('../controllers/auth/login.js');
const verifyEmailController= require('../controllers/auth/verifyEmail.js');
const sendPasswordOtpController= require('../controllers/auth/sendPasswordOtp.js');
const sendSmsOtpController= require('../controllers/auth/sendSmsOtp.js');
const verifyPasswordOtpController= require('../controllers/auth/verifyPasswordOtp.js');
const verifySmsOtpController= require('../controllers/auth/verifySmsOtp.js');
const resetPasswordController= require('../controllers/auth/resetPassword.js');
const logoutController= require('../controllers/auth/logout.js');
const refreshAccessTokenController= require('../controllers/auth/refreshToken.js');
const editProfileController= require('../controllers/auth/editProfile.js');
const deleteProfileController= require('../controllers/auth/deleteProfile.js');

const express= require("express");
const checkAuth = require('../middleware/checkAuth.js');


const router= express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/verify/:email/:token", verifyEmailController); //with token
router.post("/password/send-otp", sendPasswordOtpController);
router.post("/password/verify-otp", verifyPasswordOtpController);
router.post("/password/reset", resetPasswordController);
router.post("/sms/send-otp", sendSmsOtpController);
router.post("/sms/verify-otp", verifySmsOtpController);
router.delete("/logout", logoutController);
router.get("/refresh-token", refreshAccessTokenController);
router.put("/profile/edit", checkAuth,editProfileController);
router.delete("/profile/delete", deleteProfileController);

module.exports= router;