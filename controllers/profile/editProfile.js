const { clientModel } = require('../../models/users/client.js');
const { storeOwnerModel } = require('../../models/users/storeOwner.js');
const { adminModel } = require('../../models/users/admin.js');
const { clientProfile, storeOwnerProfile, adminProfile } = require("../../validations/profile.js");
const { setUserVerification } = require("../../utils/mailSender");
const { deleteImageFromCloudinary } = require("../../utils/upload.js");

const editProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let updates = req.body;

    console.log("profile updates => ", updates);
    console.log("profile files => ", req.file);
    console.log("uploadedUrl => ", req.uploadedUrl);
    console.log("uploadedHash => ", req.uploadedHash);

    // Forbidden fields that cannot be updated
    const forbiddenFields = [
      'password',
      'role',
      'isEmailVerified',
      'isPhoneVerified',
      'isStoreEmailVerified',
      "total_products",
      "total_orders",
      'isActive',
      'average_rating',
      'total_rates',
      'is_approved',
      'deletion_requested',
      'deletion_status',
      'totalSpent',
      'totalOrders',
      'createdBy',
      'permission',
      'totalOperations',
      'lastActivity',
    ];
    forbiddenFields.forEach(field => delete updates[field]);

    // Determine model and schema based on role
    let model;
    let schema;
    switch (userRole) {
      case 'client':
        schema = clientProfile;
        model = clientModel;
        break;
      case 'store_owner':
        schema = storeOwnerProfile;
        model = storeOwnerModel;
        break;
      case 'admin':
        schema = adminProfile;
        model = adminModel;
        break;
      default:
        schema = clientProfile;
        model = clientModel;
    }

    // Find current user first
    const currentUser = await model.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Handle Store Logo (for store owners only) ---
    if (userRole === 'store_owner' && req.uploadedUrl) {
      // Validate that hash exists
      if (!req.uploadedHash) {
        return res.status(400).json({
          message: "Image validation failed. The file hash not provided"
        });
      }

      // Delete old logo from Cloudinary if it exists
      if (currentUser.logo) {
        try {
          await deleteImageFromCloudinary(currentUser.logo);
        } catch (cloudinaryError) {
          console.error("Error deleting old logo from Cloudinary:", cloudinaryError);
          // Continue even if deletion fails
        }
      }

      // Update logo fields
      updates.logo = req.uploadedUrl;
      updates.logo_hash = req.uploadedHash;
    }

    // --- Parse and validate with partial schema ---
    // Create partial schema (all fields optional)
    const partialSchema = schema.partial();
    const parsedData = partialSchema.safeParse(updates);

    if (!parsedData.success) {
      return res.status(400).json({
        message: parsedData.error.issues[0].message,
        field: parsedData.error.issues[0].path.join('.'),
        errors: parsedData.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const validatedData = parsedData.data;

    // --- Build update query ---
    let updateQuery = {
      $set: {},
      $unset: {}
    };

    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key] === undefined || validatedData[key] === null) {
        // Only unset if the field was explicitly set to undefined/null
        // and the current value exists
        if (currentUser[key] !== undefined && currentUser[key] !== null) {
          updateQuery.$unset[key] = "";
        }
      } else {
        // Only update if value is different from current
        if (validatedData[key] !== currentUser[key]) {
          updateQuery.$set[key] = validatedData[key];
        }
      }
    });

    // Clean up empty objects
    if (Object.keys(updateQuery.$set).length === 0) {
      delete updateQuery.$set;
    }

    if (Object.keys(updateQuery.$unset).length === 0) {
      delete updateQuery.$unset;
    }

    // --- Handle email change ---
    let emailChanged = false;
    if (validatedData.email && validatedData.email !== currentUser.email) {
      // Check if email is not already taken by another user
      const existingUser = await model.findOne({
        email: validatedData.email,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email already in use by another account"
        });
      }

      updateQuery.$set.isEmailVerified = false;
      emailChanged = true;
    }

    // Check if there's anything to update
    if (Object.keys(updateQuery).length === 0) {
      return res.status(400).json({
        message: "No changes detected to update"
      });
    }

    console.log("updateQuery => ", JSON.stringify(updateQuery, null, 2));

    // --- Perform update ---
    const updatedUser = await model.findByIdAndUpdate(
      userId,
      updateQuery,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Send verification email if email changed ---
    if (emailChanged) {
      await setUserVerification(updatedUser, "10m");
    }

    // --- Return response ---
    res.status(200).json({
      message: `Profile updated successfully${emailChanged ? ", verification link sent to your email" : ""}`,
      user: updatedUser
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      message: "Update failed",
      error: error.message
    });
  }
};

module.exports = editProfileController;