const mongoose = require("mongoose");
const userModel = require("../../models/users/user");
const Order = require("../../models/order");
const auditLogModel = require("../../models/users/adminAuditLog");

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Not valid ID format!",
      });
    }

    const user = await userModel.findById(id).select("-password").lean();
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
      const recentOrders = await Order.find({ user_id: id })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      const latestDate =
        recentOrders.length > 0 ? recentOrders[0].createdAt : "No orders yet";

      const statsData = stats[0] || {
        totalSpent: 0,
        totalOrders: 0,
        averageSpent: 0,
      };

      extraData = {
        stats: {...statsData},
        latestOrderDate: latestDate,
        recentOrders,
      };
    } else if (user.role === "store_owner") {

      const storeOwnerId = new mongoose.Types.ObjectId(id);

      const storeStats = await Order.aggregate([
        { $match: { "products.owner_store_id": storeOwnerId } },
        { $unwind: {path: "$profit_breakdown.stores_payout", preserveNullAndEmptyArrays: true} },
        { $match: { "profit_breakdown.stores_payout.owner_store_id": storeOwnerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$profit_breakdown.stores_payout.amount" },
          },
        },
      ]);


      const recentOrders = await Order.find({
        "products.owner_store_id": storeOwnerId,
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("user_id", "firstName lastName")
        .select("_id createdAt total_price status products")
        .lean();


        const topProducts = await Order.aggregate([
        { $match: { "products.owner_store_id": storeOwnerId } },
        { $unwind: "$products" },
        { $match: { "products.owner_store_id": storeOwnerId } },
        { $unwind: "$products.products" },
        {
          $group: {
            _id: "$products.products.prod_id",
            productName: { $first: "$products.products.name" },
            totalSold: { $sum: "$products.products.quantity" },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 3 },
      ]);

      extraData = {
        totalRevenue: storeStats[0]?.totalRevenue ?? 0,
        totalOrders: storeStats[0]?.totalOrders ?? 0,
        recentOrders,
        topProducts,
      };
    } else if (user.role === "admin") {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      const operationsThisMonth = await auditLogModel.countDocuments({
        admin_id: new mongoose.Types.ObjectId(id),
        createdAt: { $gte: startOfMonth },
      });

      const operationStats = await auditLogModel.aggregate([
        { $match: { admin_id: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: "$operationGroup",
            count: { $sum: 1 },
          },
        },
      ]);

      const operationSummary = {
        APPROVAL: 0,
        CANCELLATION: 0,
        UPDATE: 0,
        DELETE: 0,
        ACTIVATION: 0,
        DEACTIVATION: 0,
        CREATE: 0,
      };

      operationStats.forEach(({ _id, count }) => {
        if (_id && operationSummary.hasOwnProperty(_id)) {
          operationSummary[_id] = count;
        }
      });

      const recentAuditLogs = await auditLogModel
        .find({ admin_id: new mongoose.Types.ObjectId(id) })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      extraData = {
        operationsThisMonth,
        recentAuditLogs,
        operationSummary,
      };
    }

    const userData = user.toObject ? user.toObject() : user;

    res.status(200).json({
      success: true,
      data: {
        ...userData,
        ...extraData,
      },
    });
  } catch (error) {
    console.log("error getting user by id=> ", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getUserById;
