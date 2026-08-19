const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const userModel = require("../../models/users/user");
const Order = require("../../models/order");

const approveRequestDeletion = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingAdminId = req.user.id;
    const requestingAdminRole = req.user.role;

    // Find the user to approve deletion for
    let userToApprove;
    let userRole;

    // find user
    userToApprove = await userModel.findById(userId);

    if (!userToApprove) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    userRole = userToApprove.role;

    // Prevent approving deletion of self
    if (userId === requestingAdminId) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve your own deletion request.",
      });
    }

    // Check if user has a pending deletion request
    if (
      !userToApprove.deletion_requested ||
      userToApprove.deletion_status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: `User does not have a pending deletion request. Current status: ${userToApprove.deletion_status}, deletion_requested:${userToApprove.deletion_requested}`,
      });
    }

    // Handle store owner approval
    if (userRole === "store_owner") {
      // Check if requesting admin has store management permission
      const requestingAdmin = await adminModel.findById(requestingAdminId);
      if (!requestingAdmin.permission.includes("manageStores")) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have manageStores permission. Cannot approve store deletion.",
        });
      }

      // Check for outstanding orders
      const orders = await Order.find({
        "products.owner_store_id": userId,
        status: {
          $in: ["قيد الانتظار", "جاري التجهيز", "جاهز للتوصيل", "قيد التوصيل"],
        },
      });

      if (orders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve deletion. Store has ${orders.length} outstanding order(s). Please complete ,cancel or delete them first.`,
          outstandingOrdersCount: orders.length,
        });
      }

      // Approve the deletion
      const updatedStore = await storeOwnerModel.findByIdAndUpdate(
        userId,
        {
          deletion_status: "approved",
        },
        { new: true },
      );

      const storeResponse = updatedStore.toObject();
      delete storeResponse.password;

      return res.status(200).json({
        success: true,
        message:
          "Store owner deletion request approved. The store owner will be deleted from the system.",
        data: {
          id: storeResponse._id,
          username: storeResponse.username,
          store_name: storeResponse.store_name,
          email: storeResponse.email,
          deletion_requested: storeResponse.deletion_requested,
          deletion_status: storeResponse.deletion_status,
        },
      });
    }

    // Handle admin approval
    if (userRole === "admin") {
      // Check if requesting admin has admin management permission
      const requestingAdmin = await adminModel.findById(requestingAdminId);
      if (!requestingAdmin.permission.includes("manageAdmins")) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have manageAdmins permission. Cannot approve admin deletion.",
        });
      }
      if (userToApprove.createdBy.toString() !== requestingAdminId) {
        return res.status(403).json({
          success: false,
          message:
            "You do not created this admin. Cannot approve admin deletion.",
        });
      }
      // Check if there is another admin with the same manageAdmins
      const targetAdmin = await adminModel.findById(userId);
      const targetPermissions = targetAdmin.permission;

      // Find other admins with the same or superset of permissions
      const otherAdmins = await adminModel.find({
        _id: { $ne: userId },
        deletion_status: { $ne: "approved" },
        deletion_requested: { $ne: true },
        isActive: true,
      });

      let hasAdminWithSamePrivileges = false;

      for (const admin of otherAdmins) {
        // Check if this admin has all the permissions of the target admin
        const hasAllPermissions = targetPermissions.every((permission) =>
          admin.permission.includes(permission),
        );

        if (hasAllPermissions) {
          hasAdminWithSamePrivileges = true;
          break;
        }
      }

      // Prepare warning message
      let warningMessage = "";
      if (!hasAdminWithSamePrivileges) {
        warningMessage =
          "WARNING: There is no other admin with the same permissions. If you approve this deletion, you will lose these admin permission unless you assign them to another admin first.";
      }

      // Check if target admin created other admins
      const createdAdmins = await adminModel.find({ createdBy: userId });
      let responsibilityMessage = "";
      if (createdAdmins.length > 0) {
        responsibilityMessage = `You will be responsible for the ${createdAdmins.length} admin(s) created by the deleted admin. Their 'createdBy' field will be transferred to you.`;
      }

      // Approve the deletion
      const updatedAdmin = await adminModel.findByIdAndUpdate(
        userId,
        {
          deletion_status: "approved",
        },
        { new: true },
      );

      const adminResponse = updatedAdmin.toObject();
      delete adminResponse.password;

      // Send response with warnings if applicable
      const responseMessage =
        "Admin deletion request approved. The admin will be deleted from the system.";

      const response = {
        success: true,
        message: responseMessage,
        data: {
          id: adminResponse._id,
          username: adminResponse.username,
          email: adminResponse.email,
          role: adminResponse.role,
          permission: adminResponse.permission,
          deletion_requested: adminResponse.deletion_requested,
          deletion_status: adminResponse.deletion_status,
        },
      };

      if (warningMessage) {
        response.warning = warningMessage;
      }

      if (responsibilityMessage) {
        response.responsibilityMessage = responsibilityMessage;
      }

      return res.status(200).json(response);
    }

    return res.status(400).json({
      success: false,
      message: "Invalid user role for deletion approval.",
    });
  } catch (error) {
    console.error("Error in approveRequestDeletion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve deletion request",
      error: error.message,
    });
  }
};

module.exports = approveRequestDeletion;
