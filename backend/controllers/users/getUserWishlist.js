const { clientModel } = require("../../models/users/client");
const { isValidObjectId } = require("mongoose");

const getUserWishlist = async (req, res) => {
    try {
        const clientId = req.user?.id;
        const userRole = req.user?.role;

        if (!clientId) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication required: User ID not found" 
            });
        }

        if (userRole !== "client") {
            return res.status(403).json({ 
                success: false,
                message: "Access denied: Only clients can access their wishlist",
                currentRole: userRole
            });
        }

        if (!isValidObjectId(clientId)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid user ID format" 
            });
        }

        let foundClient = await clientModel
            .findById(clientId)
            .select('_id username email wishlist')
            .lean(); // For better performance

        if (!foundClient) {
            return res.status(404).json({ 
                success: false,
                message: "Client account not found" 
            });
        }

        const wishlist = Array.isArray(foundClient.wishlist) ? foundClient.wishlist : [];

        // Filter out invalid wishlist items
        const validWishlist = wishlist.filter(item => {
            return item && (
                item.productId || 
                item.product || 
                item._id
            );
        });

        res.status(200).json({
            success: true,
            message: "Wishlist retrieved successfully",
            data: {
                wishlist: validWishlist,
                totalItems: validWishlist.length,
                userId: foundClient._id,
                username: foundClient.username
            }
        });

    } catch (error) {
        console.error("Error in getUserWishlist:", error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = getUserWishlist;