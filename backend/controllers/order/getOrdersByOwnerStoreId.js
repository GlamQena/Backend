const Order = require("../../models/order");
const Product = require("../../models/product");

const getOrdersByOwnerStoreId = async (req, res) => {
  try {
    const storeId = req.user.id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
    }

    // Find all orders that contain products from this specific store
    const orders = await Order.find({
      "products.owner_store_id": storeId,
    }).populate("user_id", "firstName lastName username email phoneNumber address")
    .populate("products.products.prod_id", "images hasReviewed").lean();

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this store",
      });
    }

    // Extract only the store's product information from each order
    const storeOrders = orders
      .map((order) => {
        // Find the specific store's data within the order
        const storeData = order.products.find(
          (store) => store.owner_store_id.toString() === storeId.toString(),
        );

        if (!storeData) return null;

        // Return only relevant information for this store
        return {
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
           hasReviewed: product.prod_id?.hasReviewed || false,
  images: product.prod_id?.images || [],  
            price_per_unit: product.price,
            subtotal: product.subtotal_price,
          })),

          store_subtotal: storeData.store_subtotal,

          // Customer information
        customer: {
            id: order.user_id?._id || order.user_id,
            name: order.user_id?.firstName 
              ? `${order.user_id.firstName} ${order.user_id.lastName || ''}`.trim()
              : order.user_id?.username || "",
            email: order.user_id?.email,
            phone: order.user_id?.phoneNumber,
            address: order.user_id?.address
              ? [
                  order.user_id.address.street,
                  order.user_id.address.district,
                  order.user_id.address.city,
                ].filter(Boolean).join("، ") //.filter(Boolean) remove any falsy or empty value from the list befor concatenate with arabic comma
              : "",
          },
          // Store's payout amount from profit breakdown
          store_payout:
            order.profit_breakdown?.stores_payout?.find(
              (payout) => payout.owner_store_id.toString() === storeId,
            )?.amount || 0,

          // Delivery information
          delivery_cost: order.delivery_cost,

          // Timestamps relevant to the store owner
          order_created_at: order.createdAt,
          order_updated_at: order.updatedAt,
        };
      })
      .filter((order) => order !== null); // Remove any null entries

    // Sort orders from oldest to newest
    storeOrders.sort(
      (a, b) => new Date(a.order_created_at) - new Date(b.order_created_at),
    );

    // Calculate summary statistics for the store owner
    const summary = {
      total_orders: storeOrders.length,
      total_revenue: storeOrders.reduce(
        (sum, order) => sum + (order.store_subtotal || 0),
        0,
      ),
      total_payout: storeOrders.reduce(
        (sum, order) => sum + (order.store_payout || 0),
        0,
      ),
      orders_by_status: storeOrders.reduce((acc, order) => {
        acc[order.order_status] = (acc[order.order_status] || 0) + 1;
        return acc;
      }, {}),
    };

    return res.status(200).json({
      success: true,
      store_id: storeId,
      summary,
      orders: storeOrders,
    });
  } catch (error) {
    console.error("Error in getOrdersByOwnerStoreId:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = getOrdersByOwnerStoreId;
