const { sendEmail } = require("./mailSender");
const sendDeletionNotification = async (
  userEmail,
  userName,
  userRole,
  deletedBy = null,
) => {
  let subject = "";
  let htmlContent = "";

  switch (userRole) {
    case "client":
      subject = "Account Deleted Successfully";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d9534f;">Account Deletion Notice</h2>
          <p>Dear ${userName || "User"},</p>
          <p>We regret to inform you that your <strong>Client Account</strong> has been successfully deleted from our system.</p>
          <p>The following data has been removed:</p>
          <ul>
            <li>Your personal account information</li>
            <li>Shopping cart items</li>
            <li>Order history</li>
          </ul>
          <p>If you believe this was done in error or wish to create a new account, please contact our support team.</p>
          <p>Thank you for being part of our community.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
      break;

    case "store_owner":
      subject = "Store Account Deleted Successfully";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d9534f;">Store Account Deletion Notice</h2>
          <p>Dear ${userName || "Store Owner"},</p>
          <p>We regret to inform you that your <strong>Store Owner Account</strong> has been successfully deleted from our system.</p>
          <p>The following data has been removed:</p>
          <ul>
            <li>Your store owner account information</li>
            <li>All products associated with your store</li>
            <li>Store-related data and configurations</li>
          </ul>
          <p>Your deletion request was reviewed and approved by our administrators.</p>
          <p>If you have any questions about this action, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
      break;

    case "admin":
      subject = "Admin Account Deleted";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d9534f;">Admin Account Deletion Notice</h2>
          <p>Dear ${userName || "Admin"},</p>
          <p>This email is to confirm that your <strong>Admin Account</strong> has been successfully deleted from the system.</p>
          <p><strong>Action performed by:</strong> ${deletedBy || "System Administrator"}</p>
          <p><strong>Date of deletion:</strong> ${new Date().toLocaleString()}</p>
          <p>If you believe this action was unauthorized, please contact the system administrator immediately.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
      break;

    default:
      subject = "Account Deleted";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d9534f;">Account Deletion Notice</h2>
          <p>Dear ${userName || "User"},</p>
          <p>Your account has been successfully deleted from our system.</p>
          <p>If you have any questions, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
  }

  try {
    await sendEmail({
      to: userEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log(`Deletion notification email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send deletion email to ${userEmail}:`, error);
  }
};

module.exports=sendDeletionNotification