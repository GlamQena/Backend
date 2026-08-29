const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const userModel = require("../../models/users/user");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Order = require("../../models/order");
const categoryModel = require("../../models/category");
const sendDeletionNotification = require("../../utils/sendDeletionNotification");
const auditLogModel = require("../../models/users/adminAuditLog");
const { deleteImageFromCloudinary } = require("../../utils/upload");

const deleteUserController = async (req, res) => {
  try {
    let userId;
    let userRole;
    let requestingUserRole = req.user.role;
    let requestingUserId = req.user.id;
    
    const forceDeletion = req.query.deletion && req.query.deletion.toLowerCase() === "true";

    // Determine which user to delete
    if (req.params.id) {
      userId = req.params.id;
      const userToDelete = await userModel.findById(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      userRole = userToDelete.role;

      if (userId === requestingUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete your own admin account.",
        });
      }
    } else {
      if (requestingUserRole === "store_owner" || requestingUserRole === "admin") {
        return res.status(403).json({
          success: false,
          message: "You cannot delete your own (admin or store owner) account in this endpoint.",
        });
      }
      userId = requestingUserId;
      userRole = req.user.role;
    }

    let deletedUser;
    let avatarUrl = null;
    let logoUrl = null;
    let productImageUrls = [];
    let productsDeleted = [];
    let cartsUpdated = [];

    // Handle CLIENT deletion
    if (userRole === "client") {
      // --- CHECK FOR UNDELIVERED ORDERS ---
      const undeliveredOrders = await Order.find({
        user_id: userId,
        status: { $nin: ["delivered", "cancelled"] }
      });

      if (undeliveredOrders.length > 0) {
        const orderStatuses = undeliveredOrders.map(order => 
          `Order #${order._id.toString().slice(-6)}: ${order.status}`
        ).join(', ');

        return res.status(403).json({
          success: false,
          message: `Cannot delete this client because they have ${undeliveredOrders.length} undelivered order(s). Please cancel or fulfill these orders first.`,
          undeliveredOrders: undeliveredOrders.map(order => ({
            orderId: order._id,
            status: order.status,
            total: order.totalAmount,
            createdAt: order.createdAt
          })),
          orderStatuses: orderStatuses,
        });
      }

      await Cart.findOneAndDelete({ user_id: userId });
      await Order.deleteMany({ user_id: userId });
      deletedUser = await clientModel.findByIdAndDelete(userId);
      if (deletedUser) {
        avatarUrl = deletedUser.avatar;
      }
    }

    // Handle STORE_OWNER deletion
    if (userRole === "store_owner") {
      deletedUser = await storeOwnerModel.findById(userId);
      
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: "Store owner not found",
        });
      }

      avatarUrl = deletedUser.avatar;
      logoUrl = deletedUser.logo;

      // Check deletion status
      if (!forceDeletion) {
        if (!deletedUser.deletion_requested) {
          return res.status(403).json({
            success: false,
            message: `Cannot delete this store owner because deletion has not been requested. Current deletion_requested status: ${deletedUser.deletion_requested}`,
          });
        }
        
        if (deletedUser.deletion_status !== "approved") {
          return res.status(403).json({
            success: false,
            message: `Cannot delete this store owner because deletion request has not been approved. Current deletion_status: ${deletedUser.deletion_status}`,
          });
        }
      } else {
        console.log(`Force deletion enabled for store owner: ${userId} by admin: ${requestingUserId}`);
      }

      const products = await Product.find({ owner_store_id: userId });
      
      // Collect all product IDs and image URLs
      const productIds = [];
      for (const product of products) {
        productIds.push(product._id);
        if (product.images && product.images.length > 0) {
          productImageUrls.push(...product.images);
        }
      }
      
      console.log(`Found ${products.length} products with ${productImageUrls.length} images to delete`);
      productsDeleted = products;

      // Remove products from all carts before deleting
      if (productIds.length > 0) {
        console.log(`Removing ${productIds.length} products from carts...`);
        
        // Find all carts that contain any of these products
        const cartsWithProducts = await Cart.find({
          "products.products.prod_id": { $in: productIds }
        });

        console.log(`Found ${cartsWithProducts.length} carts containing products from this store`);

        for (const cart of cartsWithProducts) {
          let cartModified = false;
          
          // Iterate through each store's products in the cart
          for (let storeIndex = 0; storeIndex < cart.products.length; storeIndex++) {
            const storeProds = cart.products[storeIndex];
            
            // Check if this store has any of the products to delete
            const productsToRemove = storeProds.products.filter(
              p => productIds.some(id => id.toString() === p.prod_id.toString())
            );
            
            if (productsToRemove.length > 0) {
              // Remove all products belonging to this store
              storeProds.products = storeProds.products.filter(
                p => !productIds.some(id => id.toString() === p.prod_id.toString())
              );
              cartModified = true;
              
              // If store has no products left, remove the store entry
              if (storeProds.products.length === 0) {
                cart.products.splice(storeIndex, 1);
                storeIndex--; // Adjust index after removal
              }
            }
          }
          
          if (cartModified) {
            await cart.save();
            cartsUpdated.push(cart._id);
            console.log(`Removed products from cart: ${cart._id}`);
          }
        }
        
        console.log(`Updated ${cartsUpdated.length} carts`);
      }

      // Update category counts before deleting products
      if (products.length > 0) {
        console.log(`Updating category counts for ${products.length} products...`);
        
        // Group products by category
        const categoryCounts = {};
        for (const product of products) {
          if (product.category_id) {
            const categoryId = product.category_id.toString();
            categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
          }
        }
        
        // Update each category's totalProducts count
        for (const [categoryId, count] of Object.entries(categoryCounts)) {
          await categoryModel.findByIdAndUpdate(
            categoryId,
            { $inc: { totalProducts: -count } }
          );
          console.log(`Updated category ${categoryId}: -${count} products`);
        }
      }

      // Delete all products from the database
      if (productIds.length > 0) {
        await Product.deleteMany({ owner_store_id: userId });
        console.log(`Deleted ${productIds.length} products from database`);
      }
      
      // Delete the store owner
      deletedUser = await storeOwnerModel.findByIdAndDelete(userId);
    }

    // Handle ADMIN deletion
    if (userRole === "admin") {
      deletedUser = await adminModel.findById(userId);
      
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      avatarUrl = deletedUser.avatar;

      if (!deletedUser.deletion_requested) {
        return res.status(403).json({
          success: false,
          message: `Cannot delete this admin because deletion has not been requested. Current deletion_requested status: ${deletedUser.deletion_requested}`,
        });
      }
      
      if (deletedUser.deletion_status !== "approved") {
        return res.status(403).json({
          success: false,
          message: `Cannot delete this admin because deletion request has not been approved. Current deletion_status: ${deletedUser.deletion_status}`,
        });
      }
      
      if (deletedUser.createdBy.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: `Cannot delete this admin because you did not create this admin account.`,
        });
      }
      
      await adminModel.updateMany(
        { createdBy: userId },
        { $set: { createdBy: requestingUserId } },
      );

      deletedUser = await adminModel.findByIdAndDelete(userId);
    }

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // --- DELETE ALL IMAGES FROM CLOUDINARY ---

    // Helper function to delete images with logging
    const deleteImageWithLogging = async (url, imageType, index = null) => {
      if (!url) return;
      const label = index !== null ? `${imageType} #${index + 1}` : imageType;

      try {
        await deleteImageFromCloudinary(url);
        console.log(`${label} deleted successfully from Cloudinary`);
      } catch (error) {
        console.error(`Failed to delete ${label} from Cloudinary:`, error.message);
        // Don't throw - don't fail the whole deletion if image deletion fails
      }
    };

    // 1. Delete user avatar
    await deleteImageWithLogging(avatarUrl, "User avatar");

    // 2. Delete store logo (if store owner)
    if (userRole === "store_owner") {
      await deleteImageWithLogging(logoUrl, "Store logo");
    }

    // 3. Delete all product images (if store owner)
    if (userRole === "store_owner" && productImageUrls.length > 0) {
      console.log(`Deleting ${productImageUrls.length} product images from Cloudinary...`);
      
      // Delete in batches to avoid overwhelming the API
      const batchSize = 10;
      let deletedCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < productImageUrls.length; i += batchSize) {
        const batch = productImageUrls.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (url, index) => {
            try {
              await deleteImageFromCloudinary(url);
              deletedCount++;
            } catch (error) {
              failedCount++;
              console.error(`Failed to delete product image:`, error.message);
            }
          })
        );
        console.log(`Progress: ${Math.min(i + batchSize, productImageUrls.length)}/${productImageUrls.length} images processed`);
      }
      
      console.log(`Product images deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
    }

    // Save operation log
    await adminModel.findByIdAndUpdate(requestingUserId, {
      $set: { lastActivity: new Date() },
      $inc: { totalOperations: 1 }
    });

    await auditLogModel.create({
      admin_id: requestingUserId,
      operation: "deleteUser",
      entityModel: userRole,
      entityId: userId,
      operationGroup: "DELETE"
    });

    // Prepare response message
    let deletionMessage = `${userRole} account and all related data deleted successfully`;
    if (forceDeletion && userRole === "store_owner") {
      deletionMessage = `[FORCE DELETION] ${deletionMessage} (bypassed deletion_requested and deletion_status checks)`;
    }

    // Clear cookies if user deleted themselves
    if (!req.params.id && req.user.role === "client") {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      sendDeletionNotification(
        deletedUser.email,
        deletedUser.username,
        deletedUser.role,
      );

      return res.status(200).json({
        success: true,
        message: `Profile and all related data deleted successfully and sent email to ${deletedUser.email}`,
      });
    }

    // Admin deleted someone else
    const requestingAdmin = await adminModel.findById(requestingUserId);
    sendDeletionNotification(
      deletedUser.email,
      deletedUser.username,
      deletedUser.role,
      requestingAdmin ? requestingAdmin.username : "Admin",
    );
    
    // Prepare response with additional data for store owner deletion
    const responseData = {
      success: true,
      message: `${deletionMessage} and sent email to ${deletedUser.email}`,
      deletedUserRole: userRole,
      forceDeleted: forceDeletion && userRole === "store_owner" ? true : false,
      imagesDeleted: {
        avatar: !!avatarUrl,
        logo: !!logoUrl,
        productImages: productImageUrls.length,
      },
    };

    // Add store-specific data if store owner was deleted
    if (userRole === "store_owner") {
      responseData.storeDeletion = {
        productsDeleted: productsDeleted.length,
        cartsUpdated: cartsUpdated.length,
        totalImagesDeleted: productImageUrls.length,
      };
    }

    res.status(200).json(responseData);
    
  } catch (error) {
    console.error("Error in deleteUserController:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};

module.exports = deleteUserController;