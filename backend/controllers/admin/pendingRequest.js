const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const userModel = require("../../models/users/user");

const pendingRequest = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingAdminId = req.user.id;
    const requestingAdminRole = req.user.role;

    // Find the user to set deletion to pending
    let userToPending;
    let userRole;
    let specificModel;

    // Find user and determine their model
    userToPending = await userModel.findById(userId);

    if (!userToPending) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    userRole = userToPending.role;

    // Prevent setting pending deletion for self
    if (userId === requestingAdminId) {
      return res.status(403).json({
        success: false,
        message: "You cannot set your own deletion request to pending.",
      });
    }

    // Check if user has requested deletion
    if (!userToPending.deletion_requested) {
      return res.status(400).json({
        success: false,
        message: `Cannot set deletion to pending. User has not requested deletion. Current deletion_requested status: ${userToPending.deletion_requested}`,
      });
    }

    // Check if user is already in pending status
    if (userToPending.deletion_status === "pending") {
      return res.status(400).json({
        success: false,
        message: "User's deletion request is already in pending status.",
      });
    }

    // Additional validation for store owners
    if (userRole === "store_owner") {
      // Check if requesting admin has store management permission
      const requestingAdmin = await adminModel.findById(requestingAdminId);
      if (!requestingAdmin || !requestingAdmin.permission.includes("manageStores")) {
        return res.status(403).json({
          success: false,
          message: "You do not have manageStores permission. Cannot set store owner deletion to pending.",
        });
      }
    }

    // Additional validation for admins
    if (userRole === "admin") {
      // Check if requesting admin has admin management permission
      const requestingAdmin = await adminModel.findById(requestingAdminId);
      if (!requestingAdmin || !requestingAdmin.permission.includes("manageAdmins")) {
        return res.status(403).json({
          success: false,
          message: "You do not have manageAdmins permission. Cannot set admin deletion to pending.",
        });
      }

      if(userToPending.createdBy.toString()!==requestingAdminId){
          return res.status(403).json({
          success: false,
          message: "You do not create this admin. Cannot set admin deletion to pending.",
        });
      }

    }

    // Get the specific model for proper update
    if (userRole === "store_owner") {
      specificModel = storeOwnerModel;
    } else if (userRole === "admin") {
      specificModel = adminModel;
    }

    // Set deletion status to pending
    const updatedUser = await specificModel.findByIdAndUpdate(
      userId,
      {
        deletion_status: "pending",
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update user deletion status.",
      });
    }

    // Prepare response message
      let responseMessage = `Deletion request for ${userRole} has been reverted from approved back to pending status successfully.`;
  
    // Remove sensitive data from response
    const userResponse = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    if (userResponse.password) {
      delete userResponse.password;
    }

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        id: userResponse._id,
        username: userResponse.username,
        email: userResponse.email,
        role: userResponse.role,
        deletion_requested: userResponse.deletion_requested,
        deletion_status: userResponse.deletion_status,
        previous_status: userToPending.deletion_status,
      }
    });

  } catch (error) {
    console.error("Error in pendingRequest:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set deletion request to pending status",
      error: error.message,
    });
  }
};

module.exports = pendingRequest;