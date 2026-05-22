const userModel = require("../../models/users/user");
const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const otpModel = require("../../models/auth-temps/otp");
const bcrypt = require("bcrypt");
const { sendEmail,getUrlFrontEnd } = require("../../utils/mailSender");

const addUser = async (req, res) => {
  try {
    const { role, ...userData } = req.body;

    const admin = await adminModel.findById(req.user.id);
    const adminPermissions = admin.permission || [];

    // Validate permissions for each role
    if (role === "client" && !adminPermissions.includes("manageUsers")) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You need 'manageUsers' permission to add clients.",
      });
    }

    if (role === "store_owner" && !adminPermissions.includes("manageStores")) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You need 'manageStores' permission to add store owners.",
      });
    }

    if (role === "admin" && !adminPermissions.includes("manageAdmins")) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You need 'manageAdmins' permission to add admins.",
      });
    }

    // Validate role
    const allowedRoles = ["client", "store_owner", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: client, store_owner, admin",
      });
    }

    // Check if username or email already exists
    if (!userData.email || !userData.username) {
      return res.status(400).json({
        success: false,
        message: "email and username are required",
      });
    }
    const existingUser = await userModel.findOne({
      $or: [
        { username: userData.username?.toLowerCase() },
        { email: userData.email?.toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    if (!userData.password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let newUser;

    // Create user based on role
    switch (role) {
      case "client":
        newUser = new clientModel({
          ...userData,
          password: hashedPassword,
          role: "client",
        });
        break;

      case "store_owner":
        // Validate required store owner fields
        if (!userData.store_name || !userData.store_email) {
          return res.status(400).json({
            success: false,
            message: "Store owners must provide store_name and store_email",
          });
        }

        // Check if store email already exists
        const existingStore = await storeOwnerModel.findOne({
          store_email: userData.store_email?.toLowerCase(),
        });

        if (existingStore) {
          return res.status(409).json({
            success: false,
            message: "Store email already exists",
          });
        }

        newUser = new storeOwnerModel({
          ...userData,
          password: hashedPassword,
          role: "store_owner",
          is_approved: true, 
          isActive: false,
          store_phone: "01000000000",
          store_address: {
            city: "UnKnown",
            district: "UnKnown",
            street: "UnKnown",
          },
        });
        break;

      case "admin":
        // Validate admin Permissions
        if (!userData.permission) {
          return res.status(400).json({
            success: false,
            message: "PLease, Enter permission is required",
          });
        }
        if (
          !Array.isArray(userData.permission) ||
          userData.permission.length < 3
        ) {
          return res.status(400).json({
            success: false,
            message: "Admins must have at least 3 permissions",
          });
        }

        newUser = new adminModel({
          ...userData,
          password: hashedPassword,
          role: "admin",
          createdBy: req.user.id,
          permission: userData.permission,
          isActive: false,
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role specified",
        });
    }

    // Save the user
    await newUser.save();

    // generate otp for activateAccount
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpObject = await otpModel.create({
      userId: newUser._id,
      for: "activateAccount",
      otpCode: otp,
      isActive: true,
      otpExpiry: Date.now() + 1 * 60 * 1000 * 10, // 10 mins
    });

    await otpObject.save();

    // Send welcome email with login credentials
    await sendWelcomeEmail(
      newUser._id,
      newUser.email,
      newUser.username || userData.username,
      userData.password,
      role,
      otp
    );

    // Remove sensitive data from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Add role-specific response messages
    let message = `${role} created successfully. Login credentials have been sent to their email.`;

    res.status(201).json({
      success: true,
      message: message,
      data: userResponse,
    });
  } catch (error) {
    console.error("Error in addUser:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message,
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Helper function to send welcome email
async function sendWelcomeEmail(userId,email, username, tempPassword, role,otpCode) {
  const roleDisplay = {
    client: "Client",
    store_owner: "Store Owner",
    admin: "Administrator",
  };

  const loginUrl = getUrlFrontEnd(userId,email,role);

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Glam2ena</title>
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
    .credentials {
      background-color: #0e0819;
      border: 1px solid rgba(168, 85, 247, 0.09);
      border-radius: 10px;
      padding: 15px;
      margin: 20px 0;
      font-family: monospace;
      font-size: 16px;
    }
    .credentials p {
      margin: 5px 0;
      color: #f2e8ff;
    }
    a{
      color: #f2e8ff;
      text-decoration: none;
    }
    .credentials strong {
      color: #A855F7;
    }
    .warning {
      background-color: rgba(239, 68, 68, 0.10);
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #c8aadf;
    }
    .warning strong {
      color: #ef4444;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 9999px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #7a5a9a;
      border-top: 1px solid rgba(168, 85, 247, 0.09);
      padding-top: 20px;
      margin-top: 20px;
    }
    .role-badge {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    strong {
      color: #f2e8ff;
    }
    .content p {
      color: #c8aadf;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Glam2ena! 🎉</h1>
      <p>Your account has been successfully created</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${username}</strong>,</p>
      
      <p>An administrator has created a <span class="role-badge">${roleDisplay[role]}</span> account for you on the Glam2ena platform.</p>
      
      <div class="credentials">
        <p><strong>Your Login Credentials:</strong></p>
        <p>📧 <strong>Email:</strong> ${email}</p>
        <p>🔑 <strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>🔗 <strong>OTP is:</strong> ${otpCode}</p>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important Security Notice:</strong>
        <p>This is a temporary password. For security reasons, you must change your password after your first login.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Go to Login Page</a>
      </div>
      
      <p>After logging in, you can change your password from your account settings.</p>

    </div>
    
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>© ${new Date().getFullYear()} Glam2ena. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Welcome to Glam2ena - Your ${roleDisplay[role]} Account Created`,
      html: emailHtml,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    // Don't throw error - user creation succeeded, just email failed
  }
}

module.exports = addUser;
