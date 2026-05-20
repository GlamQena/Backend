const Order = require("../../models/order");
const Product = require("../../models/product");
const { clientModel } = require("../../models/users/client");
const  {storeOwnerModel}  = require("../../models/users/storeOwner");
const axios = require("axios");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const paymob_api_key = process.env.PAYMOB_API_KEY;

const cancelOrderController = async(req, res) => {
    try{
        const order_id = req.params.id;
        const userRole = req.user.role;
        const userId = req.user.id;

        const foundOrder = await Order.findById(order_id);

        if(!foundOrder)
            return res.status(404).json({message: `order with id ${order_id} not found`});

        // Check if order is already cancelled
        if(foundOrder.status === "ملغي")
            return res.status(400).json({message: "Order is already cancelled"});

        // Check if order is already delivered
        if(foundOrder.status === "تم التوصيل")
            return res.status(400).json({message: "Cannot cancel delivered order"});

        if(foundOrder.status === "قيد التوصيل")
            return res.status(400).json({message: "Cannot cancel order that's about to deliver"});

        // Check if user has permission to cancel this order
        if(userRole === "client" && foundOrder.user_id.toString() !== userId)
            return res.status(403).json({message: "You can only cancel your own orders"});

        // Handle cancellation based on payment status
        let refundProcessed = false;
        
        // If payment was completed, process refund through Paymob
        if(foundOrder.payment.status === "مكتمل" && foundOrder.payment.method !== "cash") {
            try {
                const refundResult = await processRefund(foundOrder);
                if(refundResult.success) {
                    refundProcessed = true;
                    foundOrder.payment.status = "تم الاسترداد";
                } else {
                    return res.status(400).json({ 
                        message: "Refund failed. Please contact support.",
                        error: refundResult.error 
                    });
                }
            } catch (refundError) {
                console.error("Refund error:", refundError);
                return res.status(500).json({ 
                    message: "Error processing refund. Please contact support.",
                    error: refundError.message 
                });
            }
        } 
        // For cash orders or pending payments, just mark as cancelled
        else if(foundOrder.payment.method === "cash" || foundOrder.payment.status === "قيد الانتظار") {
            refundProcessed = true; // No refund needed
        }

        // Restore product stock
        for(const storeProds of foundOrder.products) {
            for(const item of storeProds.products) {
                await Product.findByIdAndUpdate(item.prod_id, {
                    $inc: { stock: item.quantity }
                });
            }
            
            // Decrease store's total orders count
            await storeOwnerModel.findByIdAndUpdate(
                storeProds.owner_store_id, 
                {$inc: {total_orders: -1}},
            );

            await clientModel.findByIdAndUpdate(
                storeProds.owner_store_id, 
                {$inc: {totalOrders: -1}},
            );
        }

        // Update order status
        foundOrder.status = "ملغي";
        foundOrder.cancelledAt = new Date();
        foundOrder.cancel_reason = req.body?.reason || "Cancelled by user";
        
        await foundOrder.save();

        return res.status(200).json({ 
            message: "Order cancelled successfully",
            refundProcessed: refundProcessed,
            order: {
                id: foundOrder._id,
                status: foundOrder.status,
                cancelledAt: foundOrder.cancelledAt,
                cancel_reason: foundOrder.cancel_reason,
                payment_status: foundOrder.payment.status
            }
        });

    } catch(error) {
        console.error("Cancel order error:", error);
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

// Helper function to process refund through Paymob
async function processRefund(order) {
    try {
        // First, get auth token from Paymob
        const authResponse = await axios.post(
            "https://accept.paymob.com/api/auth/tokens",
            { api_key: paymob_api_key }
        );
        const authToken = authResponse.data.token;

        // Calculate refund amount in cents (total_price includes delivery)
        const refundAmountCents = Math.round(order.total_price * 100);
        
        // Get the original transaction ID from Paymob
        // Note: You'll need to store paymob_transaction_id when payment is completed
        const transactionId = order.payment.paymob_transaction_id;
        
        if (!transactionId) {
            throw new Error("No transaction ID found for this order");
        }

        // Process refund through Paymob
        // Note: Paymob's refund API endpoint might vary - check their documentation
        const refundResponse = await axios.post(
            "https://accept.paymob.com/api/acceptance/void_refund/refund",
            {
                auth_token: authToken,
                transaction_id: transactionId,
                amount_cents: refundAmountCents.toString(),
                reason: order.cancel_reason || "Order cancelled by user"
            }
        );

        if (refundResponse.data.success || refundResponse.data.redirect_url) {
            console.log("Refund processed successfully:", refundResponse.data);
            return { 
                success: true, 
                refund_id: refundResponse.data.id,
                message: "Refund processed successfully"
            };
        } else {
            throw new Error(refundResponse.data.message || "Refund failed");
        }

    } catch (error) {
        console.error("Paymob refund error:", error.response?.data || error.message);
        
        // If refund fails, you might want to flag this for manual review
        // You could add a field to track refund failures
        return { 
            success: false, 
            error: error.response?.data?.message || error.message 
        };
    }
}

module.exports = cancelOrderController;