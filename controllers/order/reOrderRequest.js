const Order = require("../../models/order");
const Product = require("../../models/product");
const  {storeOwnerModel}  = require("../../models/users/storeOwner");

const reOrderRequest = async(req, res) => {
    try {
        const order_id = req.params.id;
        const userId = req.user.id;

        const order = await Order.findById(order_id);

        if (!order) {
            return res.status(404).json({ message: `Order with id ${order_id} not found` });
        }

        // Check if order is cancelled
        if (order.status !== "ملغي") {
            return res.status(400).json({ 
                message: "Only cancelled orders can be restored. Current status: " + order.status 
            });
        }

        // Check if user owns this order
        if (order.user_id.toString() !== userId) {
            return res.status(403).json({ message: "You can only restore your own orders" });
        }

        // Check product availability
        for (const storeProds of order.products) {
            for (const item of storeProds.products) {
                const product = await Product.findById(item.prod_id);
                
                if (!product) {
                    return res.status(404).json({ 
                        message: `Product ${item.name} no longer exists` 
                    });
                }
                
                if (product.stock < item.quantity) {
                    return res.status(400).json({ 
                        message: `Product ${item.name} has insufficient stock` 
                    });
                }
            }
        }

        // Restore the order (change status back to pending)
        order.status = "قيد الانتظار";
        order.cancelledAt = undefined; // Remove cancellation date
        order.cancel_reason = undefined; // Remove cancellation reason
        
        // Reset payment status if needed
        if (order.payment.status === "تم الاسترداد") {
            order.payment.status = "قيد الانتظار";
        }
        
        await order.save();

        // Restore stock (since you deducted it when cancelling)
        for (const storeProds of order.products) {
            for (const item of storeProds.products) {
                await Product.findByIdAndUpdate(item.prod_id, {
                    $inc: { stock: -item.quantity }
                });
            }
            
            await storeOwnerModel.findByIdAndUpdate(
                storeProds.owner_store_id, 
                { $inc: { total_orders: 1 } }
            );
        }

        return res.status(200).json({
            message: "Order restored successfully from cancelled status",
            order: {
                id: order._id,
                status: order.status,
                total_price: order.total_price
            }
        });

    } catch (error) {
        console.error("Restore order error:", error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

module.exports = reOrderRequest