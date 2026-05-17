const Order = require("../../models/order.js");

const getOrderDetailsController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
const storeId = req.user.store_id || userId;
    console.log("req.user =>", req.user);                          
console.log("storeId =>", storeId);

    const order = await Order.findById(orderId)
      .populate("user_id", "firstName lastName email phoneNumber address")
      .populate({
        path: "products.owner_store_id", 
        select: "_id store_name",
      })
      .populate({
        path: "products.products.prod_id",
        model: "product",
        select: "images hasReviewed",
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found!",
      });
    }
    console.log("owner_store_id =>", order.products[0]?.owner_store_id);
console.log("userId =>", userId);

  const reviewModel = require("../../models/review");
const userReviews = await reviewModel.find({ client_id: userId }).select("product_id").lean();
const reviewedProductIds = userReviews.map(r => r.product_id.toString());

const enrichedOrder = {
  ...order,
  products: order.products.map((store) => ({
    ...store,
    products: store.products.map((prod) => {
      const prodId = (prod.prod_id?._id || prod.prod_id)?.toString();
      return {
        ...prod,
        hasReviewed: reviewedProductIds.includes(prodId),
      };
    }),
  })),
};

let data = enrichedOrder;

    if(userRole === "store_owner"){
    const storeData = order.products.find(
  (store) =>
    (store.owner_store_id?._id || store.owner_store_id)?.toString() === storeId?.toString()
);

      if (!storeData) {
        return res.status(403).json({
          success: false,
          message: "This order does not contain products from your store",
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
           hasReviewed: product.prod_id?.hasReviewed || false,  // ✅
  images: product.prod_id?.images || [],  
            price_per_unit: product.price,
            subtotal: product.subtotal_price,
          })),

        store_subtotal: storeData.store_subtotal || 0,

        // customer info
        customer: {
          id: order.user_id?._id || order.user_id,

          name: order.user_id?.firstName
            ? `${order.user_id.firstName} ${
                order.user_id.lastName || ""
              }`.trim()
            : "",

          email: order.user_id?.email || "",

          phone: order.user_id?.phoneNumber || "",

          address: order.user_id?.address
  ? `${order.user_id.address.street || ""}، ${order.user_id.address.city || ""}، مصر.`
  : "",
        },

        // payout
        store_payout:
          order.profit_breakdown?.stores_payout?.find((payout) => {
            const payoutStoreId =
              payout.owner_store_id?._id || payout.owner_store_id;

            return payoutStoreId?.toString() === storeId.toString();
          })?.amount || 0,

        // delivery
        delivery_cost: order.delivery_cost || 0,

        // timestamps
        order_created_at: order.createdAt,

        order_updated_at: order.updatedAt,
      };
    }

    // ─────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ORDER DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching order details",
      error: error.message,
    });
  }
};

module.exports = getOrderDetailsController;
