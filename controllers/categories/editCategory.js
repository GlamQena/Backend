const categoryModel = require("../../models/category");
const { adminModel } = require("../../models/users/admin");
const auditLogModel = require("../../models/users/adminAuditLog");
const { editCategorySchema } = require("../../validations/products");

const editCategoryById = async (req, res) => {
  try {
    const requestingUserId = req.user.id;
    const { id } = req.params;
    const { name, icon, description } = req.body;

    // Check if category exists
    const existingCategory = await categoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If name is being updated, check for uniqueness
    if (name && name !== existingCategory.name) {
      const nameExists = await categoryModel.findOne({ name });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }
    }

    // Prepare update object (only include fields that are provided)
    const updateData = {};
    if (name) updateData.name = name;
    if (icon) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;

    const parsedData = await editCategorySchema.safeParse(updateData);
    if(!parsedData.success){
      errors= parsedData.error.issues.map((err) => ({message: err.message, field: err.path[0]}));
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    // Update the category
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      parsedData.data,
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators on update
      }
    );

    //save operation log
    await adminModel.findByIdAndUpdate(requestingUserId, {$set: {lastActivity: new Date()}, $inc: {totalOperations: 1}});
    const operationLog = await auditLogModel.create({
      admin_id: requestingUserId, 
      operation: "editCategory", 
      entityModel: "category", 
      entityId: updatedCategory._id, 
      operationGroup: "UPDATE",
      previousData: existingCategory.toObject(),
      newData: updatedCategory.toObject(),
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
      operationLog: operationLog.toObject(),
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }
    
    console.log("Error editing category:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = editCategoryById;