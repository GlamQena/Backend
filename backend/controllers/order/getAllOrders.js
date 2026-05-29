//TODO=>
//get all orders with populating store name and basic client data for admin dashboard

const Order = require("../../models/order");

const getAllOrders = async (req, res) => {
  try {
    const { status , client_id } = req.query;
    const query = {};

    if (status) {
      query.status = status; 
    }

    if (client_id) {
      query.user_id = client_id;
    }

    const orders = await Order.find(query)
      .populate({
        path: "user_id", 
        select: "firstName lastName phoneNumber address" 
      })
      .populate({
        path: "products.owner_store_id",
        select: "store_name"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = getAllOrders;