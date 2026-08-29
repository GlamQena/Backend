const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const { sendEmail, getUrlFrontEnd } = require("../../utils/mailSender");

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

    // Approve the store by setting is_approved to true
    storeToApprove.is_approved = true;
    
    // Save the updated store information
    const approvedStore = await storeToApprove.save();

    // Send approval email to store owner
    try {
      await sendApprovalEmail(
        approvedStore.email,
        approvedStore.username || approvedStore.store_name,
        approvedStore.store_name,
        approvedStore._id
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

// Helper function to send approval email
async function sendApprovalEmail(email, username, storeName, userId) {
  const loginUrl = getUrlFrontEnd(userId, email, "store_owner");

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Store Registration Approved - Glam2ena</title>
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
      font-size: 28px;
    }
    .header .subtitle {
      color: #c8aadf;
      margin-top: 8px;
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
    .success-badge {
      display: inline-block;
      background: linear-gradient(135deg, #22C55E, #16A34A);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    .store-info {
      background-color: #0e0819;
      border: 1px solid rgba(168, 85, 247, 0.09);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .store-info p {
      margin: 8px 0;
      color: #f2e8ff;
    }
    .store-info strong {
      color: #A855F7;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 9999px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(168, 85, 247, 0.45);
    }
    .next-steps {
      background-color: rgba(168, 85, 247, 0.05);
      border: 1px solid rgba(168, 85, 247, 0.09);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .next-steps h3 {
      color: #A855F7;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .next-steps ul {
      padding-right: 20px;
      margin: 0;
      color: #c8aadf;
    }
    .next-steps li {
      margin: 8px 0;
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
    .highlight {
      color: #FF69B4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <div class="subtitle">Your store registration has been <span class="success-badge">Approved</span></div>
    </div>
    
    <div class="content">
      <p>Dear <strong>${username}</strong>,</p>
      
      <p>We are pleased to inform you that your store <strong>"${storeName}"</strong> has been approved by our admin team on the <span class="highlight">Glam2ena</span> platform!</p>
      
      <div class="store-info">
        <p><strong>🏪 Store Name:</strong> ${storeName}</p>
        <p><strong>📧 Store Email:</strong> ${email}</p>
        <p><strong>📅 Approval Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <p>You can now start managing your store, adding products, and serving customers through the Glam2ena platform.</p>
      
      <div class="next-steps">
        <h3>📋 Next Steps:</h3>
        <ul>
          <li><strong>1. Login</strong> to your store dashboard using the link below</li>
          <li><strong>2. Complete</strong> your store profile and settings</li>
          <li><strong>3. Add</strong> your first products to start selling</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Go to Login Page</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated message from <span class="brand">Glam2ena</span>.</p>
      <p>© ${new Date().getFullYear()} Glam2ena. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: email,
      subject: `✔️ Store Registration Approved - Welcome to Glam2ena!`,
      html: emailHtml,
    });
    console.log(`Approval email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send approval email to ${email}:`, error);
    throw error; // Rethrow to handle in the main function
  }
}

module.exports = approveRegistration;