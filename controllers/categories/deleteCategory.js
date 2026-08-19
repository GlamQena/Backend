const mongoose = require("mongoose");
const { adminModel } = require("../../models/users/admin");
const auditLogModel = require("../../models/users/adminAuditLog");
const categoryModel = require("../../models/category");

const deleteCategoryById = async (req, res) => {
  try {
    const requestingUserId = req.user.id;
    const { id } = req.params;

    // Check if ID is valid format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    } //if the id was a string but valid when converting to mongoose.Types.ObjectId this condition will pass

    // Find the category
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has products
    if (category.totalProducts > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${category.totalProducts} product(s), consider deactivating it instead`,
      });
    }

    await categoryModel.findByIdAndDelete(id);

    //save operation log
    await adminModel.findByIdAndUpdate(requestingUserId, {$set: {lastActivity: new Date()}, $inc: {totalOperations: 1}});
    const operationLog = await auditLogModel.create({admin_id: requestingUserId, operation: "deleteCategory", entityModel: "category", entityId: category._id, operationGroup: "DELETE"});

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: {
        ...category.toObject(),
      },
      operationLog: operationLog.toObject(),
    });

  } catch (error) {

    console.log("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = deleteCategoryById;