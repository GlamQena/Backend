const categoryModel = require("../../models/category");

const editCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, isActive } = req.body;

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
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the category
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators on update
      }
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
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
    
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = editCategoryById;