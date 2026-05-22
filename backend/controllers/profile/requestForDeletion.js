const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const Order = require("../../models/order");
const Product = require("../../models/product");

const requestForDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let user;
    let Model;

    let warningMessage;

    if (userRole === "store_owner") {
      Model = storeOwnerModel;
      user = await Model.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Store owner not found",
        });
      }

      // Check if store already has a pending deletion request
      if (
        user.deletion_requested === true &&
        user.deletion_status === "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You already have a pending deletion request. Please wait for admin approval.",
        });
      }

      // Check if store already has an approved deletion request
      if (
        user.deletion_requested === true &&
        user.deletion_status === "approved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Your deletion request has already been approved. Your account will be deleted soon.",
        });
      }

      // Check if store has pending or preparing orders
      const pendingOrders = await Order.find({
        status: {
          $in: ["قيد الانتظار", "جاري التجهيز", "جاهز للتوصيل", "قيد التوصيل"],
        },
        "products.owner_store_id": userId,
      });

      if (pendingOrders.length > 0) {
        warningMessage = `Admin can not approve it because you have ${pendingOrders.length} pending or preparing order(s).`;
      }
    } else if (userRole === "admin") {
      Model = adminModel;
      user = await Model.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Check if admin already has a pending deletion request
      if (
        user.deletion_requested === true &&
        user.deletion_status === "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You already have a pending deletion request. Please wait for another admin to approve it.",
        });
      }

      // Check if admin already has an approved deletion request
      if (
        user.deletion_requested === true &&
        user.deletion_status === "approved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Your deletion request has already been approved. Your account will be deleted soon.",
        });
      }

      // Check if this is the last admin
      const adminCount = await adminModel.countDocuments({
        deletion_status: { $ne: "approved" },
        isActive: true,
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot request deletion. You are the last admin account. Please create another admin before requesting deletion.",
        });
      }
    }

    // Update user document with deletion request
    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      {
        deletion_requested: true,
        deletion_status: "pending",
      },
      { new: true },
    );

    // Remove sensitive data from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `Your ${userRole} account deletion request has been submitted successfully. An admin will review your request and you will be notified once approved or rejected.`,
      warningMessage,
      data: {
        id: userResponse._id,
        username: userResponse.username,
        email: userResponse.email,
        role: userResponse.role,
        deletion_requested: userResponse.deletion_requested,
        deletion_status: userResponse.deletion_status,
      },
    });
  } catch (error) {
    console.error("Error in requestForDeletion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit deletion request",
    });
  }
};

module.exports = requestForDeletion;
