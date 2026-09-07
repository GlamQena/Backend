const userModel = require("../../models/users/user");
const { deleteImageFromCloudinary } = require("../../utils/upload");

const deleteAvatarController = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    if (!user.avatar) {
      return res.status(404).json({
        success: false,
        message: "No avatar exists to delete"
      });
    }

    const avatarUrl = user.avatar;

    // Delete avatar from Cloudinary
    try {
      const deletedAvatar = await deleteImageFromCloudinary(avatarUrl);
      console.log("Cloudinary avatar deletion result:", deletedAvatar);
    } catch (error) {
      console.error("Error deleting avatar from Cloudinary:", error.message);
      // Continue with database deletion even if Cloudinary fails
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        $unset: {
          avatar: 1,
          avatar_hash: 1
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Remove sensitive data from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Avatar image deleted successfully",
      user: userResponse
    });

  } catch (error) {
    console.error("Error deleting profile avatar:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting the profile avatar",
      error: error.message
    });
  }
};

module.exports = deleteAvatarController;