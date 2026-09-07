const  {storeOwnerModel}  = require("../../models/users/storeOwner.js");
const { deleteImageFromCloudinary } = require("../../utils/upload");

const deleteStoreLogoController = async (req, res) => {
  try {
    const userId = req.user.id;

    const storeOwner = await storeOwnerModel.findById(userId);
    
    if (!storeOwner) {
      return res.status(404).json({
        success: false,
        message: "storeOwner account not found"
      });
    }

    if (!storeOwner.logo) {
      return res.status(404).json({
        success: false,
        message: "No logo exists to delete"
      });
    }

    const logoUrl = storeOwner.logo;

    // Delete logo from Cloudinary
    try {
      const deletedlogo = await deleteImageFromCloudinary(logoUrl);
      console.log("Cloudinary uploaded store logo deletion result:", deletedlogo);
    } catch (error) {
      console.error("Error deleting logo from Cloudinary:", error.message);
      // Continue with database deletion even if Cloudinary fails
    }

    const updatedStoreOwner = await storeOwnerModel.findByIdAndUpdate(
      userId,
      {
        $unset: {
          logo: 1,
          logo_hash: 1
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Remove sensitive data from response
    const storeOwnerResponse = updatedStoreOwner.toObject();
    delete storeOwnerResponse.password;

    res.status(200).json({
      success: true,
      message: "logo image deleted successfully",
      user: storeOwnerResponse
    });

  } catch (error) {
    console.error("Error deleting the store logo:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting the store logo",
      error: error.message
    });
  }
};

module.exports = deleteStoreLogoController;