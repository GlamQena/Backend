const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");

const {
  webUrl,
  backendUrl,
  mobileUrl,
} = require("../config/urls");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail(options) {
  const mailOptions = {
    from: process.env.EMAIL,
    ...options,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("email sent to:", info.accepted);
  } catch (err) {
    console.log("failed to send email:", err);
  }
}

async function sendEmailMessage(options) {
  try {
    const { to, subject, text } = options;

    if (!to || !subject || !text) {
      console.error("Missing required fields:", { to, subject, text: !!text });
      return;
    }

    const templatePath = path.join(
      __dirname,
      "../templates/emailmsg.template.html",
    );

    let emailMsgTemp = await fs.readFile(templatePath, "utf-8");

    const year = new Date().getFullYear();

    emailMsgTemp = emailMsgTemp.replace(/\{subject\}/g, subject);
    emailMsgTemp = emailMsgTemp.replace(/\{message\}/g, text);
    emailMsgTemp = emailMsgTemp.replace(/\{year\}/g, year);

    await sendEmail({
      to,
      subject,
      html: emailMsgTemp,
    });

    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.log("Error reading template or sending email:", err);
  }
}

function getUrlFrontEnd(userId, email, role, ex) {
  const payload = { id: userId, email, role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ex || "10m",
  });

  const encodedEmail = encodeURIComponent(email);
  const encodedToken = encodeURIComponent(token);

  const url = `${webUrl("/login")}?email=${encodedEmail}&role=${role}&token=${encodedToken}`;

  if (process.env.NODE_ENV === "development") {
    console.log(url);
  }
  return url;
}

async function sendEmailVerificationToUser(email, token, username, platform = "web") {
  const encodedEmail = encodeURIComponent(email);
  const encodedToken = encodeURIComponent(token);

  const frontend_url = `${webUrl("/verify-email")}?email=${encodedEmail}&token=${encodedToken}`;
  const backend_url = backendUrl(`/auth/verify/${encodedEmail}/${encodedToken}`);
  const mobile_deepLink = mobileUrl("verify", { email, token });

  // Only web and mobile are supported clients.
  // Anything else defaults to web (safe fallback — never a raw JSON endpoint).
  let url;
  if (platform === "mobile") {
    url = mobile_deepLink;
  } else {
    if (platform && platform !== "web") {
      console.warn(`[mailSender] unknown platform "${platform}", defaulting to web`);
    }
    url = frontend_url;
  }

  try {
    const templatePath = path.join(
      __dirname,
      "../templates/email.template.html",
    );

    let emailTemp = await fs.readFile(templatePath, "utf-8");

    emailTemp = emailTemp.replace(/\{username\}/g, username);
    emailTemp = emailTemp.replace(/\{url\}/g, url);
    emailTemp = emailTemp.replace(/\{year\}/g, new Date().getFullYear());

    await sendEmail({
      to: email,
      subject: "Email Verification",
      html: emailTemp,
    });

    console.log(`[verify-email] platform=${platform} url=${url}`);
  } catch (err) {
    console.log("Error reading template or sending email:", err);
  }
}

async function setUserVerification(user, ex, platform = "web") {
  user.isEmailVerified = false;

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  const emailToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ex || "10m",
  });

  const fullName = (user.firstName || "") + (user.lastName || "");
  await sendEmailVerificationToUser(
    user.email,
    emailToken,
    fullName.trim() === "" ? user.username : fullName,
    platform,
  );
}

module.exports = {
  setUserVerification,
  sendEmailVerificationToUser,
  sendEmail,
  sendEmailMessage,
  getUrlFrontEnd,
};