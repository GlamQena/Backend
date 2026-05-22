const { clientModel, userModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { setAccessRefreshTokens } = require("../../utils/acc_ref_tokens");
const { loginSchema } = require("../../validations/auth");
const { mergeGuestCartWithUserCart } = require("../../utils/cartMergeHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpModel = require("../../models/auth-temps/otp");
const { sendEmailMessage } = require("../../utils/mailSender");
const {promisify} = require("util");
const jwtVerify = promisify(jwt.verify);

const loginController = async (req, res) => {
  try {
    const token = req.query.token || null;
    let { usernameOrEmail, password, activationCode, rememberMe, session_id } =
      req.body;

    const validatedLoginSchema = loginSchema.safeParse({
      usernameOrEmail,
      password,
    });

    if (!validatedLoginSchema.success) {
      return res
        .status(400)
        .json({ message: validatedLoginSchema.error.issues[0].message });
    }

    const user = await userModel
      .findOne({
        $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or username" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    //handle admin and storeOwner firstmost login with activation code
    let resetPassCodeCreated = false;
    if (token) {
      let decodedToken;
      try {
        decodedToken = await jwtVerify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.log("admin or storeOwner firstmost login token is invalid");
        return res.status(401).json({ message: "Invalid token" });
      }

      const { id:user_id, role, email } = decodedToken;

      if (
        user_id.toString() !== user._id.toString() ||
        user.role !== role ||
        (role !== "admin" && role !== "store_owner")
      ) {
        return res.status(401).json({ message: "Invalid token user" });
      }

      if (!activationCode) {
        return res
          .status(400)
          .json({ message: "activation code is required for first login" });
      }

      activationCode = activationCode.trim();
      if (activationCode.length !== 6) {
        return res
          .status(400)
          .json({ message: "activation code must be 6 digits length" });
      }

      //verify the account activation code
      const foundCode = await otpModel.findOne({
        userId: user_id,
        otpCode: activationCode,
        for: "activateAccount",
      });

      if (
        !foundCode ||
        foundCode.otpExpiry < Date.now() ||
        foundCode.isVerified ||
        foundCode.isActive === false
      ) {
        return res
          .status(400)
          .json({
            message: `Invalid or expired activation code ${foundCode ? `(attempts left: ${3 - ++foundCode.otpAttempts})` : ""}`,
          });
      }

      foundCode.isVerified = true;
      if (foundCode.otpAttempts >= 3) {
        foundCode.isActive = false;
      }

      await foundCode.save();

      if(role === "admin" || role === "store_owner")
        await userModel.findByIdAndUpdate(user_id, { isApproved: true });

      // generate restPassword OTP for the obligatory reset pass
      const resetPassCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const foundResetPassCode = await otpModel.findOne({
        userId: user_id,
        for: "resetPassword",
      });

      if (!foundResetPassCode) {
        const newResetPasswordCode = new otpModel({
          userId: user_id,
          for: "resetPassword",
          otpCode: resetPassCode,
        });
        await newResetPasswordCode.save();
      } else {
        foundResetPassCode.otpCode = resetPassCode;
        foundResetPassCode.otpAttempts = 0;
        foundResetPassCode.isActive = true;
        foundResetPassCode.isVerified = false;

        await foundResetPassCode.save();
      }

      resetPassCodeCreated = true;

      try{
        await sendEmailMessage({
          to: user.email,
          subject: "Reset Password Code",
          text: `Your password reset code is: ${resetPassCode}`,
        });
        //don't required to await for sendEmailMessage although it's async for the response to not be late
      }catch(err){
        console.error("error sending reset password email");
      }
    }

    // MERGE CART ONLY DURING LOGIN if session_id is provided
    let cartMergeResult = null;
    if (session_id && user.role === "client") {
      cartMergeResult = await mergeGuestCartWithUserCart(user._id, session_id);
      console.log("Cart merge result during login:", cartMergeResult);
    }
    //====MERGE CART ONLY DURING LOGIN if session_id is provided===//

    let userData = user.toObject();
    delete userData["password"];

    const { accessToken, refreshToken } = setAccessRefreshTokens(
      res,
      user,
      rememberMe,
    );

    res.status(200).json({
      message: cartMergeResult?.merged
        ? "Login successful. Guest cart merged with your account."
        : resetPassCodeCreated
          ? "Login successful. Please reset your password with the new code sent to your email."
          : "Successful login...",
      user: userData,
      accessToken,
      refreshToken,
      cart_merged: cartMergeResult?.merged || false,
      resetPassCodeCreated,
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};

module.exports = loginController;
