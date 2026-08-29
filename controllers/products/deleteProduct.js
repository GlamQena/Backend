const Product = require('../../models/product');
const { storeOwnerModel } = require("../../models/users/storeOwner");
const orderModel = require('../../models/order');
const cartModel = require('../../models/cart');
const categoryModel = require('../../models/category');
const { deleteImageFromCloudinary } = require("../../utils/upload");

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const storeOwnerId = req.user.id;

    const product = await Product.findOne({ 
      _id: productId, 
      owner_store_id: storeOwnerId 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found to delete"
      });
    }

    // Check if product has associated orders
    const productOrders = await orderModel.find({
      "products.owner_store_id": product.owner_store_id,
      "products.products.prod_id": productId
    });

    if (productOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Can't delete this product, it has ${productOrders.length} associated orders. Make it inactive instead.`,
        ordersCount: productOrders.length,
        suggestion: "Use toggle status to make the product inactive instead of deleting."
      });
    }

    const imagesToDelete = product.images || [];
    
    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} product images from Cloudinary...`);
      
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const imageUrl of imagesToDelete) {
        try {
          await deleteImageFromCloudinary(imageUrl);
          console.log(`Deleted product image: ${imageUrl}`);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete product image ${imageUrl}:`, error.message);
          failedCount++;
          // Continue with other images even if one fails
        }
      }
      
      console.log(`Image deletion summary: ${deletedCount} deleted, ${failedCount} failed`);
    }

    // Delete the product from database
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete product from database"
      });
    }

    // Remove product from carts
    const cartsWithProduct = await cartModel.find({
      "products.products.prod_id": productId
    });

    for (const cart of cartsWithProduct) {
      let cartModified = false;
      
      // Iterate through each store's products
      for (let storeIndex = 0; storeIndex < cart.products.length; storeIndex++) {
        const storeProds = cart.products[storeIndex];
        
        // Check if this store has the product
        const productIndex = storeProds.products.findIndex(
          p => p.prod_id.toString() === productId
        );
        
        if (productIndex !== -1) {
          // Remove the product from this store's products
          storeProds.products.splice(productIndex, 1);
          cartModified = true;
          
          // If store has no products left, remove the store entry
          if (storeProds.products.length === 0) {
            cart.products.splice(storeIndex, 1);
            storeIndex--;
          }
        }
      }
      
      if (cartModified) {
        await cart.save();
        console.log(`Removed product from cart: ${cart._id}`);
      }
    }

    await storeOwnerModel.findByIdAndUpdate(
      storeOwnerId, 
      { $inc: { total_products: -1 } }
    );

    if (deletedProduct.category_id) {
      await categoryModel.findByIdAndUpdate(
        deletedProduct.category_id, 
        { $inc: { totalProducts: -1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Product deleted successfully. ${imagesToDelete.length > 0 ? `(${imagesToDelete.length} images removed from Cloudinary)` : ''}`,
      data: {
        productId: deletedProduct._id,
        productName: deletedProduct.name,
        imagesDeleted: imagesToDelete.length,
        cartsUpdated: cartsWithProduct.length
      }
    });

  } catch (error) {
    console.error("Error deleting the product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = deleteProduct;