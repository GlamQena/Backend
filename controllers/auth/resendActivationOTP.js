const { userModel } = require("../../models/users/user");
const otpModel = require("../../models/auth-temps/otp");
const { sendEmail } = require("../../utils/mailSender");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const jwtVerify = promisify(jwt.verify);

const resendActivationOTPController = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: "Email and activation token are required"
      });
    }

    let decodedToken;
    try {
      decodedToken = await jwtVerify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired activation token. Please contact your administrator."
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email"
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account is already active. Please login normally."
      });
    }

    if (decodedToken.id.toString() !== user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Invalid token for this user"
      });
    }

    if (!["admin", "store_owner"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Activation is only for admin and store owner accounts"
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // use findOneAndUpdate with upsert for cleaner code
    const updatedOTP = await otpModel.findOneAndUpdate(
      { 
        userId: user._id, 
        for: "activateAccount" 
      },
      {
        userId: user._id,
        for: "activateAccount",
        otpCode: otpCode,
        otpAttempts: 0,
        isActive: true,
        isVerified: false,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      },
      { 
        upsert: true,        // Create if doesn't exist
        new: true,           // Return the updated document
        setDefaultsOnInsert: true // Apply default values if creating new
      }
    );

    const roleDisplay = {
      store_owner: "Store Owner",
      admin: "Administrator"
    };

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Activation Code - Glam2ena</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #f2e8ff;
          background-color: #07040f;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #1a0e2e;
          border-radius: 28px;
          padding: 30px;
          border: 1px solid rgba(168, 85, 247, 0.22);
          box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #A855F7;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #A855F7;
          margin: 0;
        }
        .content {
          margin-bottom: 30px;
        }
        .content p {
          color: #c8aadf;
          margin: 12px 0;
        }
        .content strong {
          color: #f2e8ff;
        }
        .otp-box {
          background-color: #0e0819;
          border: 2px solid #A855F7;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #A855F7;
          letter-spacing: 8px;
          font-family: monospace;
        }
        .warning {
          background-color: rgba(239, 68, 68, 0.10);
          border-left: 4px solid #FF69B4;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
          color: #c8aadf;
        }
        .warning strong {
          color: #FF69B4;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #7a5a9a;
          border-top: 1px solid rgba(168, 85, 247, 0.09);
          padding-top: 20px;
          margin-top: 20px;
        }
        .footer .brand {
          color: #A855F7;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 New Activation Code</h1>
          <p>Your new activation code for ${roleDisplay[user.role]} account</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${user.username}</strong>,</p>
          
          <p>You requested a new activation code for your ${roleDisplay[user.role]} account on Glam2ena.</p>
          
          <div class="otp-box">
            <p style="color: #f2e8ff; margin-bottom: 10px;">Your new activation code is:</p>
            <div class="otp-code">${otpCode}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>You have <strong>3 attempts</strong> to enter the correct code.</p>
          </div>
          
          <p style="font-size: 14px; color: #7a5a9a;">
            If you didn't request this code, please ignore this email or contact support.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from <span class="brand">Glam2ena</span>.</p>
          <p>© ${new Date().getFullYear()} Glam2ena. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await sendEmail({
      to: user.email,
      subject: `New Activation Code - Glam2ena`,
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message: "New activation code sent to your email",
      email: user.email,
      expiresIn: "10 minutes"
    });

  } catch (error) {
    console.error("Error in resendActivationOTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend activation code",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

module.exports = resendActivationOTPController;