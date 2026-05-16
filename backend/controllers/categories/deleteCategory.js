const categoryModel = require("../../models/category");

const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.totalProducts > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${category.totalProducts} product(s)`,
      });
    }

    await categoryModel.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
      data: {
        id: category._id,
        name: category.name,
      },
    });
  } catch (error) {
   return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = deleteCategoryById;
