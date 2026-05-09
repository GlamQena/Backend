const Product = require("../../models/product");

const editProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const owner_store_id = req.user.id;

    // Allowed fields that can be updated
    const allowedUpdates = [
      "category_id",
      "name",
      "description",
      "price",
      "stock",
      "ingredients",
      "images",
      "weight",
      "dimensions",
      "skinType",
    ];

    // Filter out invalid fields
    const validUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });

    // Images
    const imagePaths = req.files.map((file) => file.path);
    validUpdates["images"] = imagePaths;

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

    // Validate images array length if being updated
    if (validUpdates.images && validUpdates.images.length) {
      if (validUpdates.images.length < 1 || validUpdates.images.length > 7) {
        return res.status(400).json({
          success: false,
          message: "You must provide at least 1 image but not more than 7",
        });
      }
    }

    // Validate price if being updated
    if (validUpdates.price !== undefined && validUpdates.price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    // Validate stock if being updated
    if (validUpdates.stock !== undefined && validUpdates.stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    // Validate weight if being updated
    if (validUpdates.weight !== undefined && validUpdates.weight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Weight must be greater than 0",
      });
    }

    // Validate dimensions if being updated
    if (validUpdates.dimensions) {
      const { length, width, height } = validUpdates.dimensions;
      if (length && (length < 1 || length > 100)) {
        return res.status(400).json({
          success: false,
          message: "Length must be between 1 and 100 cm",
        });
      }
      if (width && (width < 1 || width > 100)) {
        return res.status(400).json({
          success: false,
          message: "Width must be between 1 and 100 cm",
        });
      }
      if (height && (height < 1 || height > 100)) {
        return res.status(400).json({
          success: false,
          message: "Height must be between 1 and 100 cm",
        });
      }
    }

    // Validate skinType if being updated
    if (validUpdates.skinType) {
      const validSkinTypes = [
        "oily",
        "dry",
        "combination",
        "sensitive",
        "normal",
      ];
      if (!validSkinTypes.includes(validUpdates.skinType)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid skinType. Must be one of: oily, dry, combination, sensitive, normal",
        });
      }
    }

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
