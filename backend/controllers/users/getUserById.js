const mongoose = require("mongoose");
const userModel = require("../../models/users/user");
const Order = require("../../models/order");

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Not valid ID format!",
      });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let extraData = {};

    if (user.role === "client") {
      const stats = await Order.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$total_price" },
            totalOrders: { $sum: 1 },
            averageSpent: { $avg: "$total_price" },
          },
        },
        {
          $project: {
            totalSpent: 1,
            totalOrders: 1,
            averageSpent: { $round: ["$averageSpent", 2] },
          },
        },
      ]);
      const recentOrder = await Order.find({ user_id: id })
        .sort({ createdAt: -1 })
        .limit(1);

      const latestDate =
        recentOrder.length > 0 ? recentOrder[0].createdAt : "No orders yet";

      const statsData = stats[0] || {
        totalSpent: 0,
        totalOrders: 0,
        averageSpent: 0,
      };

      extraData = {
        ...statsData,
        latestOrderDate: latestDate,
      };
    } else if (user.role === "store_owner") {
      const storeStats = await Order.aggregate([
        {
          $match: {
            "products.owner_store_id": new mongoose.Types.ObjectId(id),
          },
        },
        { $unwind: "$products" },
        {
          $match: {
            "products.owner_store_id": new mongoose.Types.ObjectId(id),
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$products.store_subtotal" },
          },
        },
      ]);
      extraData = storeStats[0] || { totalRevenue: 0, totalOrders: 0 };
    }

    const userData = user.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...userData,
        ...extraData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getUserById;
