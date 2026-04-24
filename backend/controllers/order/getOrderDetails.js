const Order = require("../../models/order.js");

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user_id", "firstName lastName email phone")
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
      return res.status(404).json({ message: "Order Not Found!" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order details", error: error.message });
  }
};

module.exports = getOrderDetails;
