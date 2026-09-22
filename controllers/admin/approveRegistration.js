const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const { sendEmail } = require("../../utils/mailSender");
const { webUrl } = require("../../config/urls");
const { resolveEmailPalette } = require("../../utils/emailPalettes");

// Helper function to get missing fields
const getMissingFields = (store) => {
  const missingFields = [];
  
  if (!store.store_name || store.store_name.trim().length === 0) {
    missingFields.push("store_name");
  }
  
  if (!store.store_phone || store.store_phone.trim().length === 0) {
    missingFields.push("store_phone");
  }
  
  if (!store.store_email || store.store_email.trim().length === 0) {
    missingFields.push("store_email");
  }
  
  if (!store.store_address || 
      !store.store_address.city || 
      !store.store_address.district || 
      !store.store_address.street) {
    missingFields.push("store_address (city, district, street)");
  }
   
  return missingFields;
};

async function sendApprovalEmail(email, username, storeName, palette) {
  const loginUrl = webUrl("/login");
  const p = palette;   // short alias — the template is long enough as it is

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Store Registration Approved - Glam2ena</title>
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
        🎉 Congratulations!
      </h1>
      <div style="color:${p.textSecondary}; margin-top:8px;">
        Your store registration has been
        <span style="
          display:inline-block;
          background:${p.successGradient};
          color:${p.successText};
          padding:6px 16px;
          border-radius:20px;
          font-size:14px;
          font-weight:bold;
        ">Approved</span>
      </div>
    </div>

    <!-- Body -->
    <div>
      <p style="color:${p.textSecondary}; margin:12px 0;">
        Dear <strong style="color:${p.textPrimary};">${username}</strong>,
      </p>

      <p style="color:${p.textSecondary}; margin:12px 0;">
        We are pleased to inform you that your store
        <strong style="color:${p.textPrimary};">"${storeName}"</strong>
        has been approved by our admin team on the
        <span style="color:${p.primaryMain};">Glam2ena</span> platform!
      </p>

      <!-- Store info -->
      <div style="
        background-color:${p.bgInput};
        border:1px solid ${p.borderSubtle};
        border-radius:10px;
        padding:20px;
        margin:20px 0;
      ">
        <p style="margin:8px 0; color:${p.textPrimary};">
          <strong style="color:${p.primaryMain};">🏪 Store Name:</strong> ${storeName}
        </p>
        <p style="margin:8px 0; color:${p.textPrimary};">
          <strong style="color:${p.primaryMain};">📧 Store Email:</strong> ${email}
        </p>
        <p style="margin:8px 0; color:${p.textPrimary};">
          <strong style="color:${p.primaryMain};">📅 Approval Date:</strong>
          ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <p style="color:${p.textSecondary}; margin:12px 0;">
        You can now start managing your store, adding products, and serving
        customers through the Glam2ena platform.
      </p>

      <!-- Next steps -->
      <div style="
        background-color:${p.bgInput};
        border:1px solid ${p.borderSubtle};
        border-radius:10px;
        padding:20px;
        margin:20px 0;
      ">
        <h3 style="color:${p.primaryMain}; margin-top:0; margin-bottom:12px;">
          📋 Next Steps:
        </h3>
        <ul style="padding-right:20px; margin:0; color:${p.textSecondary};">
          <li style="margin:8px 0;"><strong>1. Login</strong> to your store dashboard using the link below</li>
          <li style="margin:8px 0;"><strong>2. Complete</strong> your store profile and settings</li>
          <li style="margin:8px 0;"><strong>3. Add</strong> your first products to start selling</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${loginUrl}" style="
          display:inline-block;
          background-color:${p.primaryMain};
          background:${p.primaryGradient};
          color:${p.buttonText};
          padding:14px 32px;
          text-decoration:none;
          border-radius:9999px;
          margin:20px 0;
          text-align:center;
          font-weight:600;
        ">Go to Login Page</a>
      </div>
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
      <p>This is an automated message from
        <span style="color:${p.primaryMain}; font-weight:bold;">Glam2ena</span>.
      </p>
      <p>© ${new Date().getFullYear()} Glam2ena. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: email,
      subject: "Store Registration Approved - Welcome to Glam2ena!",
      html: emailHtml,
    });
    console.log(`Approval email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send approval email to ${email}:`, error);
    throw error;
  }
}

const approveRegistration = async (req, res) => {
  try {
    // Check if requesting admin has manageStores permission
    const requestingAdmin = await adminModel.findById(req.user.id);

    if (!requestingAdmin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found or unauthorized.",
      });
    }

    if (!requestingAdmin.permission.includes("manageStores")) {
      return res.status(403).json({
        success: false,
        message: "You do not have manageStores permission. Cannot approve store registration.",
      });
    }

    // Get store ID from request parameters
    const storeId = req.params.id;

    // Validate store ID
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required.",
      });
    }

    // Find the store to approve
    const storeToApprove = await storeOwnerModel.findById(storeId);

    // Check if store exists
    if (!storeToApprove) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    // Check if store is already approved
    if (storeToApprove.is_approved) {
      return res.status(400).json({
        success: false,
        message: "Store registration is already approved.",
      });
    }

    // CHECK IF DATA STORE IS COMPLETED BEFORE APPROVING
    // Validate required store information is complete
    const isDataComplete = getMissingFields(storeToApprove).length === 0;

    if (!isDataComplete) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve store registration. Store information is incomplete.",
        details: {
          missingFields: getMissingFields(storeToApprove),
          suggestion: "Please ask the store owner to complete all required information before approval."
        }
      });
    }

    storeToApprove.is_approved = true;
    storeToApprove.isActive = true;

    const approvedStore = await storeToApprove.save();

    const palette = resolveEmailPalette(approvedStore.preferences?.theme);

    // Send approval email to store owner
    try {
      await sendApprovalEmail(
        approvedStore.email,
        approvedStore.username || approvedStore.store_name,
        approvedStore.store_name,
        palette
      );
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the approval if email fails, just log it
    }

    // Return success response with approved store data
    return res.status(200).json({
      success: true,
      message: "Store registration approved successfully. An email notification has been sent to the store owner.",
      data: {
        storeId: approvedStore._id,
        storeName: approvedStore.store_name,
        storeEmail: approvedStore.store_email,
        ownerEmail: approvedStore.email,
        isApproved: approvedStore.is_approved,
      }
    });

  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in approveRegistration:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while approving the store.",
      error: error.message
    });
  }
};

module.exports = approveRegistration;