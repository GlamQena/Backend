const Order = require("../../models/order");
const reviewModel = require("../../models/review");

const getClientOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;
       // جلب الحاله من query
    // const status = req.query.status;

 const orderFilter = { user_id: userId };
   //     if (status) {
    //       orderFilter.status = status;
    // }

    const orders = await Order.find(orderFilter)
      .sort({ createdAt: -1 })      // الاحدث  اولاً

      //   (populate) جلب اسم المتجر
      .populate({ 
        path: "products.owner_store_id",
         select: "store_name",
         })
         
      //  (populate) جلب بيانات المنتجات
      .populate({
         path: "products.products.prod_id",
          select: "images" ,
        })
      .lean(); // ✅ allows adding custom fields

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    // ✅ add hasReviewed to each product
    for (const order of orders) {
      for (const store of order.products) {
        for (const prod of store.products) {
          const productId = prod.prod_id?._id || prod.prod_id;
          if (!productId) {
            prod.hasReviewed = false;
            continue;
          }
          const reviewExists = await reviewModel.findOne({
            client_id: userId,
            product_id: productId,
          });
          prod.hasReviewed = !!reviewExists;
        }
      }
    }

    res.status(200).json({ success: true, count: orders.length, data: orders });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = getClientOrdersController;