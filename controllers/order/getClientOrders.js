const Order = require("../../models/order");
const reviewModel = require("../../models/review");

const getClientOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderFilter = { user_id: userId };

    const orders = await Order.find(orderFilter)
      .sort({ createdAt: -1 })      // الاحدث  اولاً

      //   (populate) جلب اسم المتجر
      .populate({ 
        path: "products.owner_store_id",
         select: "store_name logo",
         })
         
      //  (populate) جلب بيانات المنتجات
      .populate({
         path: "products.products.prod_id",
          select: "name price stock images hasReviewed" ,
        })

      .populate("user_id", "avatar firstName lastName email phoneNumber address")
      .lean();

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
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