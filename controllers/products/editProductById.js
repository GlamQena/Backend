const cartModel = require("../../models/cart");
const Product = require("../../models/product");
const { productSchema } = require("../../validations/products");
const { deleteImageFromCloudinary } = require("../../utils/upload");

const editProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const owner_store_id = req.user.id;

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
    console.log("uploadedUrls => ", req.uploadedUrls);
    console.log("uploadedHashes => ", req.uploadedHashes);

    let existingImages = product.images || [];
    let imagesToKeep = [];
    let imagesToDelete = [];

    // Check if frontend sent existingImages field (which images to keep)
    if (updates.existingImages !== undefined) {
      try {
        // Parse the existing images array from the request
        if (typeof updates.existingImages === 'string') {
          imagesToKeep = JSON.parse(updates.existingImages);
        } else if (Array.isArray(updates.existingImages)) {
          imagesToKeep = updates.existingImages;
        }
        console.log("Images to keep from frontend:", imagesToKeep);
        console.log("Current product images:", existingImages);
      } catch (e) {
        console.error("Error parsing existingImages:", e);
        imagesToKeep = existingImages; // Keep all if parsing fails
      }

      // Find images that were removed (exist in product but not in imagesToKeep)
      imagesToDelete = existingImages.filter(
        img => !imagesToKeep.includes(img)
      );

      // Delete removed images from Cloudinary
      if (imagesToDelete.length > 0) {
        console.log(`Deleting ${imagesToDelete.length} images from Cloudinary...`);
        
        for (const imageUrl of imagesToDelete) {
          try {
            await deleteImageFromCloudinary(imageUrl);
            console.log(`Deleted image: ${imageUrl}`);
          } catch (error) {
            console.error(`Failed to delete image ${imageUrl}:`, error.message);
            // Continue with other images even if one fails
          }
        }
      }

      // Set the images to keep
      validUpdates["images"] = imagesToKeep;
    } else {
      // If existingImages not sent, keep all existing images
      validUpdates["images"] = existingImages;
    }

    // Handle new images uploaded
    if (req.uploadedUrls && req.uploadedUrls.length > 0) {
      // Validate that hashes exist and match URLs count
      if (!req.uploadedHashes || req.uploadedHashes.length !== req.uploadedUrls.length) {
        return res.status(400).json({
          success: false,
          message: "Image validation failed. Hashes don't match uploaded images.",
        });
      }
      
      // Append new images to existing ones (images we're keeping)
      const currentImages = validUpdates["images"] || [];
      validUpdates["images"] = [...currentImages, ...req.uploadedUrls];
      validUpdates["images_hashes"] = req.uploadedHashes;
      
      console.log(`Added ${req.uploadedUrls.length} new images`);
    }

    // Check if there's anything to update
    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Parse ingredients and dimensions if they exist
    let parsedIngredients = validUpdates.ingredients;
    if (validUpdates.ingredients && typeof validUpdates.ingredients === 'string') {
      try {
        parsedIngredients = JSON.parse(validUpdates.ingredients);
      } catch(e) {
        parsedIngredients = [];
      }
    }

    let parsedDimensions = validUpdates.dimensions || product.dimensions;
    if (validUpdates.dimensions && typeof validUpdates.dimensions === 'string') {
      try {
        parsedDimensions = JSON.parse(validUpdates.dimensions);
      } catch(e) {
        parsedDimensions = product.dimensions || { length: 15, width: 10, height: 5 };
      }
    }

    // Parse volume if it exists
    let parsedVolume = validUpdates.volume;
    if (validUpdates.volume !== undefined && validUpdates.volume !== null) {
      parsedVolume = Number(validUpdates.volume);
      if (isNaN(parsedVolume)) {
        parsedVolume = null;
      }
    }

    const enhancedUpdates = {
      ...validUpdates,
      ingredients: parsedIngredients,
      price: validUpdates.price ? Number(validUpdates.price) : product.price,
      stock: validUpdates.stock ? Number(validUpdates.stock) : product.stock,
      weight: validUpdates.weight ? Number(validUpdates.weight) : product.weight,
      volume: parsedVolume !== undefined ? parsedVolume : product.volume,
      dimensions: {
        width: Number(parsedDimensions.width) || product.dimensions?.width || 10,
        height: Number(parsedDimensions.height) || product.dimensions?.height || 5,
        length: Number(parsedDimensions.length) || product.dimensions?.length || 15,
      }
    };

    // Use partial schema for validation (only validate fields being updated)
    const partialSchema = productSchema.partial();
    const parsedUpdates = partialSchema.safeParse(enhancedUpdates);

    if(!parsedUpdates.success) {
      console.log("zod error ->", parsedUpdates.error?.issues?.map(err => ({field: err.path.join("."), message: err.message})));
      return res.status(400).json({
        message: `${parsedUpdates.error.issues[0].message}`,
        errors: parsedUpdates.error?.issues?.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: enhancedUpdates },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("category_id", "name")
      .populate("owner_store_id", "store_name store_email");

    if (!updatedProduct) {
      return res.status(400).json({
        success: false,
        message: "failed to update product data",
      });
    }

    // Update carts if name or price changed
    if(validUpdates.name || validUpdates.price) {
      let productCarts = await cartModel.find({"products.products.prod_id": updatedProduct._id});
      for(let cart of productCarts) {
        let cartModified = false;
        for(let storeProds of cart.products) {
          for(let prod of storeProds.products) {
            if(prod.prod_id.toString() === updatedProduct._id.toString()) {
              if(validUpdates.name && prod.name !== updatedProduct.name) {
                prod.name = updatedProduct.name;
                cartModified = true;
              }
              if(validUpdates.price && prod.price !== updatedProduct.price) {
                prod.price = updatedProduct.price;
                cartModified = true;
              }
            }
          }
        }
        if(cartModified) {
          await cart.save();
        }
      }
    }

    // Return success response with deleted images info
    const imagesDeletedCount = imagesToDelete.length;

    return res.status(200).json({
      success: true,
      message: `Product updated successfully${imagesDeletedCount > 0 ? ` (${imagesDeletedCount} old images removed)` : ''}`,
      data: updatedProduct,
      imagesDeleted: imagesDeletedCount,
      imagesKept: imagesToKeep.length,
      imagesAdded: req.uploadedUrls?.length || 0,
      totalImages: updatedProduct.images?.length || 0,
    });
  } catch (error) {
    console.log("server error => ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = editProductById;