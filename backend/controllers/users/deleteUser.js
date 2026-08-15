const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const userModel = require("../../models/users/user");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Order = require("../../models/order");
const sendDeletionNotification = require("../../utils/sendDeletionNotification");
const fs = require("fs");
const path = require("path");
const auditLogModel = require("../../models/users/adminAuditLog");

const deleteUserController = async (req, res) => {
  try {
    let userId;
    let userRole;
    let requestingUserRole = req.user.role;
    let requestingUserId = req.user.id;
    
    // Check for force deletion flag in query params (case-insensitive)
    const forceDeletion = req.query.deletion && 
                         req.query.deletion.toLowerCase() === "true";

    // Determine which user to delete (either from params or self-deletion)
    if (req.params.id) {
      // Admin is deleting another user
      userId = req.params.id;
      const userToDelete = await userModel.findById(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      userRole = userToDelete.role;

      // Prevent admin from deleting themselves
      if (userId === requestingUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete your own admin account.",
        });
      }
    } else {
      // User is deleting themselves
      if (
        requestingUserRole === "store_owner" ||
        requestingUserRole === "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot delete your own (admin or store owner) account in this endPoint.",
        });
      }
      userId = requestingUserId;
      userRole = req.user.role;
    }

    let deletedUser;

    // Handle CLIENT deletion
    if (userRole === "client") {
      await Cart.findOneAndDelete({ user_id: userId });
      await Order.deleteMany({ user_id: userId });
      deletedUser = await clientModel.findByIdAndDelete(userId);
    }

    // Handle STORE_OWNER deletion
    if (userRole === "store_owner") {
      deletedUser = await storeOwnerModel.findById(userId);

      // CHECK FOR FORCE DELETION (admin can delete without checking deletion_requested)
      if (!forceDeletion) {
        // Normal deletion flow - check if deletion was requested and approved
        if (!deletedUser.deletion_requested) {
          return res.status(403).json({
            success: false,
            message: `Cannot delete this store owner because deletion has not been requested. Current deletion_requested status: ${deletedUser.deletion_requested}`,
          });
        }
        
        if (deletedUser.deletion_status !== "approved") {
          return res.status(403).json({
            success: false,
            message: `Cannot delete this store owner because deletion request has not been approved. Current deletion_status: ${deletedUser.deletion_status}`,
          });
        }
      } else {
        // FORCE DELETION - Admin is forcing deletion regardless of deletion_requested status
        console.log(`Force deletion enabled for store owner: ${userId} by admin: ${requestingUserId}`);
      }

      // Delete all products associated with the store owner
      await Product.deleteMany({ owner_store_id: userId });
      
      // Delete the store owner
      deletedUser = await storeOwnerModel.findByIdAndDelete(userId);
    }

    // Handle ADMIN deletion
    if (userRole === "admin") {
      deletedUser = await adminModel.findById(userId);

      // Note: Force deletion flag is NOT applied to admin accounts for security reasons
      if (!deletedUser.deletion_requested) {
        return res.status(403).json({
          success: false,
          message: `Cannot delete this admin because deletion has not been requested. Current deletion_requested status: ${deletedUser.deletion_requested}`,
        });
      }
      
      if (deletedUser.deletion_status !== "approved") {
        return res.status(403).json({
          success: false,
          message: `Cannot delete this admin because deletion request has not been approved. Current deletion_status: ${deletedUser.deletion_status}`,
        });
      }
      
      // Check if the requesting admin created this admin
      if (deletedUser.createdBy.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: `Cannot delete this admin because you did not create this admin account.`,
        });
      }
      
      // Remove admin's references from other admins (createdBy field) moved to requesting Admin
      await adminModel.updateMany(
        { createdBy: userId },
        { $set: { createdBy: requestingUserId } },
      );

      deletedUser = await adminModel.findByIdAndDelete(userId);
    }

    // Check if user was found and deleted
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    //save operation log
    await adminModel.findByIdAndUpdate(requestingUserId, {$set: {lastActivity: new Date()}, $inc: {totalOperations: 1}});
    const operationLog = await auditLogModel.create({admin_id: requestingUserId, operation: "deleteUser", entityModel: userRole, entityId: userId, operationGroup: "DELETE"});

    // Delete avatar image locally from uploads if exists
    if (deletedUser.image) {
      const avatarPath = path.join(__dirname, "../../", deletedUser.image);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Prepare response message with force deletion info if applicable
    let deletionMessage = `${userRole} account and all related data deleted successfully`;
    if (forceDeletion && userRole === "store_owner") {
      deletionMessage = `[FORCE DELETION] ${deletionMessage} (bypassed deletion_requested and deletion_status checks)`;
    }

    // Clear cookies if user deleted themselves
    if (!req.params.id && req.user.role === "client") {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      // Send email notification to user
      sendDeletionNotification(
        deletedUser.email,
        deletedUser.username,
        deletedUser.role,
      );

      return res.status(200).json({
        success: true,
        message: `Profile and all related data deleted successfully and sent email to ${deletedUser.email}`,
      });
    }

    // If admin deleted someone else, don't clear cookies
    // Send email notification to deleted user with admin info
    const requestingAdmin = await adminModel.findById(requestingUserId);
    sendDeletionNotification(
      deletedUser.email,
      deletedUser.username,
      deletedUser.role,
      requestingAdmin ? requestingAdmin.username : "Admin",
    );
    
    res.status(200).json({
      success: true,
      message: `${deletionMessage} and sent email to ${deletedUser.email}`,
      deletedUserRole: userRole,
      forceDeleted: forceDeletion && userRole === "store_owner" ? true : false,
    });
    
  } catch (error) {
    console.error("Error in deleteUserController:", error);
    res.status(500).json({ 
      success: false,
      message: "Delete failed", 
      error: error.message 
    });
  }
};

module.exports = deleteUserController;