const userModel = require("../../models/users/user");
const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const otpModel = require("../../models/auth-temps/otp");
const bcrypt = require("bcrypt");
const { sendEmail,getUrlFrontEnd } = require("../../utils/mailSender");
const auditLogModel = require("../../models/users/adminAuditLog");
const { resolveEmailPalette } = require("../../utils/emailPalettes");

const addUser = async (req, res) => {
  try {
    const { role, ...userData } = req.body;

    const admin = await adminModel.findById(req.user.id);
    const adminPermissions = admin.permission || [];

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
    const allowedRoles = [
      "store_owner", 
      "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: store_owner, admin",
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
      case "store_owner":
        // Validate required store owner fields
        if (!userData.store_name || !userData.store_email) {
          return res.status(400).json({
            success: false,
            message: "you must provide the store name and email",
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
            message: "you must set the permission of the admin to be added",
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

    //store operation log
    admin.totalOperations += 1;
    admin.lastActivity = new Date();
    await admin.save();

    const operationLog = await auditLogModel.create({admin_id: admin._id, operation: "addUser", entityModel: role, entityId: newUser._id, operationGroup: "CREATE"});

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

    const palette = resolveEmailPalette(newUser.preferences?.theme);

    // Send welcome email with login credentials
    await sendWelcomeEmail(
      newUser._id,
      newUser.email,
      newUser.username || userData.username,
      userData.password,
      role,
      otp,
      palette
    );

    // Remove sensitive data from response
    const userResponse = newUser.toObject();
    if(userResponse.password)
      delete userResponse.password;

    // Add role-specific response messages
    let message = `${role} created successfully. Login credentials have been sent to their email.`;

    res.status(201).json({
      success: true,
      message: message,
      data: userResponse,
      operationLog,
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

async function sendWelcomeEmail(userId, email, username, tempPassword, role, otpCode, palette) {
  const p = palette;

  const roleDisplay = {
    store_owner: "Store Owner",
    admin:       "Administrator",
  };

  const loginUrl = getUrlFrontEnd(userId, email, role, "2d");

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Glam2ena</title>
</head>
<body style="
  margin:0;
  padding:20px;
  background-color:${p.bgPage};
  font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height:1.6;
  color:${p.textPrimary};
  -webkit-text-size-adjust:100%;
">
  <div style="
    max-width:600px;
    margin:0 auto;
    background-color:${p.bgCard};
    border:1px solid ${p.borderProminent};
    border-radius:28px;
    padding:30px;
  ">

    <!-- Header -->
    <div style="
      text-align:center;
      border-bottom:2px solid ${p.primaryMain};
      padding-bottom:20px;
      margin-bottom:20px;
    ">
      <h1 style="color:${p.primaryMain}; margin:0; font-size:28px;">
        Welcome to Glam2ena! 👋🏼
      </h1>
      <p style="color:${p.textSecondary}; margin:8px 0 0;">
        Your account has been successfully created
      </p>
    </div>

    <!-- Body -->
    <div>
      <p style="color:${p.textSecondary}; margin:12px 0;">
        Hello <strong style="color:${p.textPrimary};">${username}</strong>,
      </p>

      <p style="color:${p.textSecondary}; margin:12px 0;">
        An administrator has created a
        <span style="
          display:inline-block;
          background:${p.primaryGradient};
          color:${p.buttonText};
          padding:4px 12px;
          border-radius:20px;
          font-size:12px;
          font-weight:bold;
        ">${roleDisplay[role]}</span>
        account for you on the Glam2ena platform.
      </p>

      <!-- Credentials -->
      <div style="
        background-color:${p.bgInput};
        border:1px solid ${p.borderSubtle};
        border-radius:10px;
        padding:15px;
        margin:20px 0;
        font-family:'Courier New', monospace;
        font-size:16px;
      ">
        <p style="margin:5px 0; color:${p.textPrimary};">
          <strong style="color:${p.primaryMain};">Your Login Credentials:</strong>
        </p>
        <p style="margin:5px 0; color:${p.textPrimary};">
          📧 <strong style="color:${p.primaryMain};">Email:</strong> ${email}
        </p>
        <p style="margin:5px 0; color:${p.textPrimary};">
          🔑 <strong style="color:${p.primaryMain};">Temporary Password:</strong> ${tempPassword}
        </p>
        <p style="margin:5px 0; color:${p.textPrimary};">
          🔗 <strong style="color:${p.primaryMain};">Activation Code:</strong> ${otpCode}
        </p>
      </div>

      <!-- Security warning -->
      <div style="
        background-color:${p.dangerBg};
        border-left:4px solid ${p.dangerBorder};
        padding:15px;
        margin:20px 0;
        font-size:14px;
        color:${p.textSecondary};
      ">
        <strong style="color:${p.dangerText};">⚠️ Important Security Notice:</strong>
        <p style="margin:8px 0 0; color:${p.textSecondary};">
          This is a temporary password. For security reasons, you must change
          your password after your first login.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${loginUrl}" style="
          display:inline-block;
          background-color:${p.primaryMain};
          background:${p.primaryGradient};
          color:${p.buttonText};
          padding:12px 24px;
          text-decoration:none;
          border-radius:9999px;
          margin:20px 0;
          text-align:center;
          font-weight:600;
        ">Go to Login Page</a>
      </div>

      <p style="color:${p.textSecondary}; margin:12px 0;">
        After logging in, you can change your password from your account settings.
      </p>
    </div>

    <!-- Footer -->
    <div style="
      text-align:center;
      font-size:12px;
      color:${p.textMuted};
      border-top:1px solid ${p.borderSubtle};
      padding-top:20px;
      margin-top:20px;
    ">
      <p style="margin:4px 0;">This is an automated message, please do not reply to this email.</p>
      <p style="margin:4px 0;">© ${new Date().getFullYear()} Glam2ena. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: email,
      subject: `Welcome to Glam2ena - Your ${roleDisplay[role]} Account Created`,
      html: emailHtml,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    // Don't throw — user creation succeeded, just email failed
  }
}

module.exports = addUser;
