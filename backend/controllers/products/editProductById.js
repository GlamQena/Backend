const Product = require("../../models/product");
const { productSchema } = require("../../validations/products");

const editProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const owner_store_id = req.user.id;

    // Allowed fields that can be updated
    const allowedUpdates = Object.keys(productSchema.shape);

    // Filter out invalid fields
    const validUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });

    console.log("edit product files => ", req.files);
    // Images

    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map((file) => file.path);
      validUpdates["images"] = imagePaths;
    }

    // Check if there's anything to update
    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Find the product and verify ownership
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if the user owns this product
    if (product.owner_store_id.toString() !== owner_store_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You don't own this product",
      });
    }

    const parsedUpdates= productSchema.safeParse(validUpdates);

    if(!parsedUpdates.success)
      return res.status(400).json({
        message: `${parsedUpdates.error.issues[0]}`,
        errors: parsedUpdates.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
      });

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: validUpdates },
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
      },
    )
      .populate("category_id", "name") // Populate category name
      .populate("owner_store_id", "store_name store_email"); // Populate owner info

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = editProductById;
