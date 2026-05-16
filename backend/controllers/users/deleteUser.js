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

const deleteUserController = async (req, res) => {
  try {
    let userId;
    let userRole;
    let requestingUserRole = req.user.role;
    let requestingUserId = req.user.id;
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
          message:
            "You cannot delete your own (admin or store owner) account in this endPoint.",
        });
      }
      userId = requestingUserId;
      userRole = req.user.role;
    }

    let deletedUser;

    if (userRole === "client") {
      await Cart.findOneAndDelete({ user_id: userId });
      await Order.deleteMany({ user_id: userId });
      deletedUser = await clientModel.findByIdAndDelete(userId);
    }

    if (userRole === "store_owner") {
      deletedUser = await storeOwnerModel.findById(userId);

      if (!deletedUser.deletion_requested) {
        return res.status(403).json({
          message: `You cannot delete this store_owner because his deletion_requested ${deletedUser.deletion_requested}`,
        });
      }
      if (deletedUser.deletion_status !== "approved") {
        return res.status(403).json({
          message: `You cannot delete this store_owner because his deletion_status ${deletedUser.deletion_status}`,
        });
      }
      // Delete all products
      await Product.deleteMany({ owner_store_id: userId });
      deletedUser = await storeOwnerModel.findByIdAndDelete(userId);
    }

    if (userRole === "admin") {
      deletedUser = await adminModel.findById(userId);

      if (!deletedUser.deletion_requested) {
        return res.status(403).json({
          message: `You cannot delete this admin because his deletion_requested ${deletedUser.deletion_requested}`,
        });
      }
      if (deletedUser.deletion_status !== "approved") {
        return res.status(403).json({
          message: `You cannot delete this admin because his deletion_status ${deletedUser.deletion_status}`,
        });
      }
      if (deletedUser.createdBy.toString() !== requestingUserId) {
        return res.status(403).json({
          message: `You cannot delete this admin because not created by you`,
        });
      }
      // Remove admin's references from other admins (createdBy field) moved to requesting Admin
      await adminModel.updateMany(
        { createdBy: userId },
        { $set: { createdBy: requestingUserId } },
      );

      deletedUser = await adminModel.findByIdAndDelete(userId);
    }

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete avatar image if exists
    if (deletedUser.image) {
      const avatarPath = path.join(__dirname, "../../", deletedUser.image);
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    // Clear cookies if user deleted themselves
    if (!req.params.id && req.user.role === "client") {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      // send email to user
      sendDeletionNotification(deletedUser.email,deletedUser.username,deletedUser.role)

      return res.status(200).json({
        message: `Profile and all related data deleted successfully and sent email to ${deletedUser.email}`,
      });
    }

    // If admin deleted someone else, don't clear cookies
    // send email to user
    sendDeletionNotification(deletedUser.email,deletedUser.username,deletedUser.role,(await adminModel.findById(requestingUserId)).username)
    res.status(200).json({
      success: true,
      message: `${userRole} account and all related data deleted successfully and sent email to ${deletedUser.email}`,
      deletedUserRole: userRole,
    });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

module.exports = deleteUserController;
