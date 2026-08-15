const productModel = require("../../models/product");
const { clientModel } = require("../../models/users/client");
const { isValidObjectId } = require("mongoose");

const removeFromWishlist = async (req, res) => {
    try {
        const clientId = req.user?.id;
        const { productId } = req.query;
        let productDeleted = false;

        if (!clientId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!isValidObjectId(clientId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid client ID format"
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        let foundClient = await clientModel.findById(clientId);
        
        if (!foundClient) {
            return res.status(404).json({
                success: false,
                message: "Client account not found"
            });
        }

        // Check if product exists (soft check - don't block removal)
        let foundProduct = null;
        try {
            foundProduct = await productModel.findById(productId);
        } catch (error) {
            // Product might be deleted or have invalid ID
            console.log("Product lookup error:", error.message);
        }

        if (!foundProduct) {
            productDeleted = true;
            console.log(`Product ${productId} not found in database - will remove from wishlist if exists`);
        }

        // Check if product is in wishlist
        const productIndex = foundClient.wishlist.findIndex(
            wish => wish.productId && wish.productId.toString() === productId.toString()
        );

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in your wishlist"
            });
        }

        const removedItem = foundClient.wishlist[productIndex];
        foundClient.wishlist.splice(productIndex, 1);
        await foundClient.save();

        const response = {
            success: true,
            message: productDeleted 
                ? "Product removed from wishlist (product no longer exists in store)" 
                : "Product removed from wishlist successfully",
            data: {
                user: foundClient,
                removedItem: removedItem,
                productExists: !!foundProduct,
                productDeleted: productDeleted
            }
        };

        // Log warning if product was deleted
        if (productDeleted) {
            console.warn(`⚠️ Removed orphaned wishlist item for product ${productId} (product no longer exists)`);
        }

        console.log("Wishlist after removal:", foundClient.wishlist);
        res.status(200).json(response);

    } catch (error) {
        console.error("removeFromWishlist error:", error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = removeFromWishlist;