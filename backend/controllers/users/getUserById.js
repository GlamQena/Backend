const mongoose = require("mongoose");
const userModel = require("../../models/users/user");
const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "not valid id format!",
      });
    }

    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "not found!",
      });
    }

    let profileData = null;

    switch (user.role) {
      case "client":
        profileData = await clientModel.findById(id);
        break;

      case "store_owner":
        profileData = await storeOwnerModel.findById(id);
        break;

      case "admin":
        profileData = await adminModel.findById(id);
        break;

      default:
        profileData = null;
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        profile: profileData ? profileData.toObject() : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getUserById;
