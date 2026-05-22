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
        <!DOCTYPE html>
          <html lang="en">
           <head>
           <meta charset="UTF-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>Account Deletion from Glam2ena</title>
           <style>
             body {
              margin: 0;
              padding: 20px;
              background-color: #07040f;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
           </style>
           </head>
           <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(168, 85, 247, 0.22); border-radius: 28px; background-color: #1a0e2e; box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);">
              <h2 style="color: #ef4444; margin-top: 0;">Deletion from Glam2ena</h2>
              <p style="color: #c8aadf;">Dear ${userName || "User"},</p>
              <p style="color: #c8aadf;">We regret to inform you that your <strong style="color: #f2e8ff;">Client Account</strong> has been successfully deleted from our system.</p>
              <p style="color: #c8aadf;">The following data has been removed:</p>
              <ul style="color: #c8aadf;">
                <li>Your personal account information</li>
                <li>Shopping cart items</li>
                <li>Order history</li>
              </ul>
              <p style="color: #c8aadf;">If you believe this was done in error or wish to create a new account, please contact our support team.</p>
              <p style="color: #c8aadf;">Thank you for being part of our community.</p>
              <hr style="border: none; border-top: 1px solid rgba(168, 85, 247, 0.09); margin: 20px 0;">
              <p style="color: #7a5a9a; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
            </div>
           </body>
         </html>
      `;
      break;

    case "store_owner":
      subject = "Store Account Deleted Successfully";
      htmlContent = `
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deletion from Glam2ena</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #07040f;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
  </style>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(168, 85, 247, 0.22); border-radius: 28px; background-color: #1a0e2e; box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);">
    <h2 style="color: #ef4444; margin-top: 0;">Deletion from Glam2ena</h2>
    <p style="color: #c8aadf;">Dear ${userName || "Store Owner"},</p>
    <p style="color: #c8aadf;">We regret to inform you that your <strong style="color: #f2e8ff;">Store Owner Account</strong> has been successfully deleted from our system.</p>
    <p style="color: #c8aadf;">The following data has been removed:</p>
    <ul style="color: #c8aadf;">
      <li>Your store owner account information</li>
      <li>All products associated with your store</li>
      <li>Store-related data and configurations</li>
    </ul>
    <p style="color: #c8aadf;">Your deletion request was reviewed and approved by our administrators.</p>
    <p style="color: #c8aadf;">If you have any questions about this action, please contact our support team.</p>
    <hr style="border: none; border-top: 1px solid rgba(168, 85, 247, 0.09); margin: 20px 0;">
    <p style="color: #7a5a9a; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
      `;
      break;

    case "admin":
      subject = "Admin Account Deleted";
      htmlContent = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deletion from Glam2ena</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #07040f;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
  </style>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(168, 85, 247, 0.22); border-radius: 28px; background-color: #1a0e2e; box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);">
    <h2 style="color: #ef4444; margin-top: 0;">Deletion from Glam2ena</h2>
    <p style="color: #c8aadf;">Dear ${userName || "Admin"},</p>
    <p style="color: #c8aadf;">This email is to confirm that your <strong style="color: #f2e8ff;">Admin Account</strong> has been successfully deleted from the system.</p>
    <p style="color: #c8aadf;"><strong style="color: #f2e8ff;">Action performed by:</strong> ${deletedBy || "System Administrator"}</p>
    <p style="color: #c8aadf;"><strong style="color: #f2e8ff;">Date of deletion:</strong> ${new Date().toLocaleString()}</p>
    <p style="color: #c8aadf;">If you believe this action was unauthorized, please contact the system administrator immediately.</p>
    <hr style="border: none; border-top: 1px solid rgba(168, 85, 247, 0.09); margin: 20px 0;">
    <p style="color: #7a5a9a; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
      `;
      break;
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

module.exports = sendDeletionNotification;
