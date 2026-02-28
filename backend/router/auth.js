import {registerController} from '../controllers/auth/register.js'
import {loginController} from '../controllers/auth/login.js'
import {sendEmailOtpController} from '../controllers/auth/sendEmailOtp.js'
import {sendSmsOtpController} from '../controllers/auth/sendSmsOtp.js'
import {verifyEmailOtpController} from '../controllers/auth/verifyEmailOtp.js'
import {verifySmsOtpController} from '../controllers/auth/verifySmsOtp.js'
import {resetPasswordController} from '../controllers/auth/resetPassword.js'
import {logoutController} from '../controllers/auth/logout.js'


import {router} from 'express';

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/otp/email", sendEmailOtpController);
router.post("/otp/sms", sendSmsOtpController);
router.post("/verify/email", verifyEmailOtpController);
router.post("/verify/sms", verifySmsOtpController);
router.post("/reset-password", resetPasswordController);
router.delete("/logout", logoutController);

module.exports= router;