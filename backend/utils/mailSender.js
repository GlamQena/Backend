const nodemailer= require("nodemailer");
const path= require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");

const transporter= nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
    tls:{
        rejectUnauthorized: false,
    }
});

async function sendEmail(options) {
    const mailOptions = {
        from: process.env.EMAIL,
        ...options
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("email sent to:", info.accepted);
    } catch (err) {
        console.log("failed to send email:", err);
    }
}

async function sendEmailVerificationToUser(email, token) {
    const url = `http://localhost:${process.env.PORT || 3000}/auth/verify/${email}/${token}`;

    try {
        const templatePath = path.join(__dirname, "../templates/email.template.html");

        let emailTemp = await fs.readFile(templatePath, "utf-8");

        emailTemp = emailTemp.replace("{url}", url);

        await sendEmail({ 
            to: email, 
            subject: "Email Verification", 
            html: emailTemp 
        });

        if (process.env.NODE_ENV === "development") {
            console.log(url);
        }
    } catch (err) {
        console.log("Error reading template or sending email:", err);
    }
}

async function setUserVerification(user, ex) {

    user.isEmailVerified = false;

    const payload={
            id: user._id,
            email: user.email,
            role: user.role,
    }
    const emailToken =  jwt.sign(payload, process.env.JWT_SECRET, {expiresIn:ex|| "8h"});
    
    await sendEmailVerificationToUser(user.email, emailToken);
}

module.exports = {
    setUserVerification,
    sendEmailVerificationToUser,
    sendEmail
};