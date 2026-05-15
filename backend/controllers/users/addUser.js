const userModel = require("../../models/users/user");
const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../../utils/mailSender");

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
          is_approved: false, 
        });
        break;

      case "admin":
        // Validate admin Permissions
        if (!userData.permission) {
          return res.status(400).json({
            success: false,
            message: "permission is required",
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

    // Send welcome email with login credentials
    await sendWelcomeEmail(
      newUser.email,
      newUser.username || userData.username,
      userData.password,
      role,
    );

    // Remove sensitive data from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Add role-specific response messages
    let message = `${role} created successfully. Login credentials have been sent to their email.`;
    if (role === "store_owner") {
      message =
        "Store owner created successfully. Login credentials have been sent. They will need admin approval before they can start selling.";
    }

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
async function sendWelcomeEmail(email, username, tempPassword, role) {
  const roleDisplay = {
    client: "Client",
    store_owner: "Store Owner",
    admin: "Administrator",
  };

  const loginUrl = "http://localhost:3000/login";

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Glam2ena</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .content {
          margin-bottom: 30px;
        }
        .credentials {
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 16px;
        }
        .credentials p {
          margin: 5px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
          margin-top: 20px;
        }
        .role-badge {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
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
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <p>This is a temporary password. For security reasons, you must change your password after your first login.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Go to Login Page</a>
          </div>
          
          <p>After logging in, you can change your password from your account settings.</p>
          
          ${
            role === "store_owner"
              ? `
            <div class="warning">
              <strong>📢 Note for Store Owners:</strong>
              <p>Your store account requires admin approval before you can start selling products. You will receive a notification once your store is approved.</p>
            </div>
          `
              : ""
          }
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
