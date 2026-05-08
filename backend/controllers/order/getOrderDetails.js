const Order = require("../../models/order.js");

const getOrderDetailsController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findById(orderId)
      .populate("user_id", "firstName lastName email phoneNumber address")
      .populate({
        path: "products.owner_store_id", 
        select: "store_name",
      })
      .populate({
        path: "products.products.prod_id", 
        model: "product", 
        select: "images",
      })
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order Not Found!" });
    }

    let data = order; //for client page

    if(userRole === "store_owner"){
      const storeData = order.products.find(
          (store) => store.owner_store_id.toString() === userId,
        );

      if (!storeData) {
        return res.status(403).json({ 
          success: false, 
          message: "This order does not contain products from your store" 
        });
      }

      data = {
          order_id: order._id,
          order_status: order.status,
          order_date: order.createdAt,
          payment_method: order.payment?.method,
          payment_status: order.payment?.status,

          // Store-specific product information
          store_products: storeData.products.map((product) => ({
            product_id: product.prod_id,
            product_name: product.name,
            quantity: product.quantity,
            price_per_unit: product.price,
            subtotal: product.subtotal_price,
          })),

          store_subtotal: storeData.store_subtotal,

          // Customer information
          customer:  {
            id: order.user_id?._id || order.user_id,
            name: order.user_id?.firstName 
              ? `${order.user_id.firstName} ${order.user_id.lastName || ''}` 
              : "",
            email: order.user_id?.email,
            phone: order.user_id?.phoneNumber,
          },

          // Store's payout amount from profit breakdown
          store_payout:
            order.profit_breakdown?.stores_payout?.find(
              (payout) => payout.owner_store_id.toString() === userId,
            )?.amount || 0,

          // Delivery information
          delivery_cost: order.delivery_cost,

          // Timestamps relevant to the store owner
          order_created_at: order.createdAt,
          order_updated_at: order.updatedAt,
        };
    } 
    //the return data compatible with the one in getOrdersByOwnerStoreId, 
    // considering both the details page received the order state from the orders page or called this endpoint as a second choice

    res.status(200).json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order details", error: error.message });
  }
};

module.exports = getOrderDetailsController;
