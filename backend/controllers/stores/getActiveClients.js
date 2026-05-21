const mongoose = require("mongoose");
const Order = require("../../models/order");

const getActiveClients = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    const activeClients = await Order.aggregate([
      {
        $match: {
          "products.owner_store_id": new mongoose.Types.ObjectId(storeOwnerId),
        },
      },

      { $unwind: "$products" },

      {
        $match: {
          "products.owner_store_id": new mongoose.Types.ObjectId(storeOwnerId),
        },
      },

      {
        $group: {
          _id: "$user_id",
          totalSpent: { $sum: "$products.store_subtotal" },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "clientInfo",
        },
      },

      { $unwind: "$clientInfo" },

      {
        $project: {
          _id: 1,
          fullName: {
            $concat: ["$clientInfo.firstName", " ", "$clientInfo.lastName"],
          },
          email: "$clientInfo.email",
          phoneNumber: "$clientInfo.phoneNumber",
          image: "$clientInfo.image",
          location: "$clientInfo.address.city",
          totalSpent: 1,
          totalOrders: 1,
          lastOrderDate: 1,
          isVIP: { $gt: ["$totalOrders", 10] },
        },
      },

      { $sort: { totalSpent: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: activeClients.length,
      data: activeClients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = getActiveClients;
