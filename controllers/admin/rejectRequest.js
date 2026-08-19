const { storeOwnerModel } = require("../../models/users/storeOwner");

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const storeOwner = await storeOwnerModel.findById(id);

    if (!storeOwner) {
      return res
        .status(404)
        .json({ success: false, message: "Store owner not found!" });
    }

    if (type === "registration") {
      await storeOwnerModel.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message:
          "Registration request rejected and store owner deleted successfully.",
      });
    }

    if (type === "deletion") {
      storeOwner.deletion_requested = false;
      storeOwner.deletion_status = "rejected";
      await storeOwner.save();

      return res.status(200).json({
        success: true,
        message: "Deletion request rejected. Store status updated.",
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Please specify request type!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = rejectRequest;
