const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");

const {
  webUrl,
  backendUrl,
  mobileUrl,
} = require("../config/urls");
const { EMAIL_PALETTES, resolveEmailPalette } = require("./emailPalettes");

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
      "../templates/emailMessage.hbs",
    );

    const emailMsgTemp = await fs.readFile(templatePath, "utf-8");

    const data = {
      ...EMAIL_PALETTES.light,   // generic messages always use light
      subject,
      message: text,
      year: new Date().getFullYear(),
    };

    const missing = [];
    const rendered = emailMsgTemp.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (match, key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          return String(data[key]);
        }
        missing.push(key);
        return match;
      },
    );

    if (missing.length > 0) {
      throw new Error(
        `sendEmailMessage: missing values for: ${[...new Set(missing)].join(", ")}`,
      );
    }

    await sendEmail({
      to,
      subject,
      html: rendered,
    });

    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Error reading template or sending email:", err);
    throw err;
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

async function sendEmailVerificationToUser(email, token, username, platform = "web", theme) {
  const encodedEmail = encodeURIComponent(email);
  const encodedToken = encodeURIComponent(token);

  const frontend_url = `${webUrl("/verify-email")}?email=${encodedEmail}&token=${encodedToken}`;
  const backend_url = backendUrl(`/auth/verify/${encodedEmail}/${encodedToken}`);
  const mobile_deepLink = mobileUrl("verify", { email, token });

  const mobile_bridgeUrl =
    `${webUrl("/app/verify")}?deepLink=${encodeURIComponent(mobile_deepLink)}`;

  let url;
  if (platform === "mobile") {
    url = mobile_bridgeUrl;
  } else {
    if (platform && platform !== "web") {
      console.warn(`[mailSender] unknown platform "${platform}", defaulting to web`);
    }
    url = frontend_url;
  }

  try {
    const templatePath = path.join(
      __dirname,
      "../templates/verifyEmail.hbs",
    );

    let emailTemp = await fs.readFile(templatePath, "utf-8");

    const data = {
      ...resolveEmailPalette(theme),    // verification email always uses light considering the user hasn't been logged-in to update his prefered theme choice
      username,
      url,
      year: new Date().getFullYear(),
    };

    const missing = [];
    const rendered = emailTemp.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (match, key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          return String(data[key]);
        }
        missing.push(key);
        return match;                     // leave the placeholder for diagnosis
      },
    );

    if (missing.length > 0) {
      throw new Error(
        `sendEmailVerificationToUser: missing values for: ${[...new Set(missing)].join(", ")}`,
      );
    }

    await sendEmail({
      to: email,
      subject: "Email Verification",
      html: rendered,
    });

    console.log(`[verify-email] platform=${platform} url=${url}`);
  } catch (err) {
    console.error("[verify-email] failed:", err);   // ← use error, not log
    throw err;                                      // ← let the caller decide
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
    user.preferences?.theme
  );
}

module.exports = {
  setUserVerification,
  sendEmailVerificationToUser,
  sendEmail,
  sendEmailMessage,
  getUrlFrontEnd,
};