const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");

const getSystemAdminStatistics = async (req, res) => {
  try {
    const currentDate = new Date();
    const lastYearStart = new Date(
      currentDate.getFullYear() - 1,
      currentDate.getMonth(),
      1,
    );
    const lastMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1,
    );
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const twoMonthsAgoStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1,
    );

    // 1. Aggregate last year profits per month
    const lastYearProfits = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: lastYearStart },
          "payment.status": "مكتمل",
          status: "تم التوصيل",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalProfit: { $sum: "$profit_breakdown.platform_revenue.products" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const profitsPerMonth = lastYearProfits.map((item) => ({
      month: item._id.month,
      year: item._id.year,
      profit: item.totalProfit,
    }));

    // 2. Count active stores (approved and not requested deletion)
    const activeStores = await storeOwnerModel.countDocuments({
      is_approved: true,
      isActive: true,
      deletion_requested: { $ne: true },
    });

    // 3. Count active categories
    const activeCategories = await categoryModel.countDocuments({
      isActive: true,
    });

    // 4. Count active clients
    const clients = await clientModel.countDocuments({
      isActive: true,
      deletion_requested: { $ne: true },
    });

    // 5. Count pending orders (pending status)
    const pendingOrders = await orderModel.countDocuments({
      status: "قيد الانتظار",
    });

    // 6. Count pending registration requests (store owners not approved yet)
    const pendingRegistrationRequests = await storeOwnerModel.countDocuments({
      is_approved: false,
      isActive: true,
      deletion_requested: { $ne: true },
    });

    // 7. Count pending deletion requests
    const pendingDeletionRequests = await Promise.all([
      storeOwnerModel.countDocuments({
        deletion_requested: true,
        deletion_status: "pending",
      }),
      adminModel.countDocuments({
        deletion_requested: true,
        deletion_status: "pending",
      }),
    ]);

    const totalPendingDeletionRequests =
      pendingDeletionRequests[0] + pendingDeletionRequests[1];

    // 8. Calculate platform commission (15% of all completed orders)
    const platformCommissionAgg = await orderModel.aggregate([
      {
        $match: {
          "payment.status": "مكتمل",
          status: "تم التوصيل",
        },
      },
      {
        $group: {
          _id: null,
          totalPlatformCommission: {
            $sum: "$profit_breakdown.platform_revenue.products",
          },
        },
      },
    ]);

    const totalPlatformCommission =
      platformCommissionAgg[0]?.totalPlatformCommission || 0;

    // 9. Calculate total profits (platform commission from all completed orders)
    const totalProfits = totalPlatformCommission;

    // 10. Calculate profit growth rate in the last month (%)
    const lastMonthProfits = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonthStart, $lt: currentMonthStart },
          "payment.status": "مكتمل",
          status: "تم التوصيل",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$profit_breakdown.platform_revenue.products" },
        },
      },
    ]);

    const currentMonthProfits = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart },
          "payment.status": "مكتمل",
          status: "تم التوصيل",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$profit_breakdown.platform_revenue.products" },
        },
      },
    ]);

    const previousMonthProfit = lastMonthProfits[0]?.total || 0;
    const currentMonthProfit = currentMonthProfits[0]?.total || 0;

    let profitGrowthRate = 0;
    if (previousMonthProfit > 0) {
      profitGrowthRate =
        ((currentMonthProfit - previousMonthProfit) / previousMonthProfit) *
        100;
    } else if (currentMonthProfit > 0) {
      profitGrowthRate = 100; // 100% growth from zero
    }

    // Round to 2 decimal places
    profitGrowthRate = Math.round(profitGrowthRate * 100) / 100;

    // Calculate total completed orders for context
    const totalCompletedOrders = await orderModel.countDocuments({
      "payment.status": "مكتمل",
      status: "تم التوصيل",
    });

    // Calculate average order value
    const averageOrderValue =
      totalCompletedOrders > 0 ? totalProfits / totalCompletedOrders : 0;

    return res.status(200).json({
      success: true,
      data: {
        // Last year profits breakdown
        profitsPerMonth: profitsPerMonth,

        // Counts
        activeStores,
        activeCategories,
        clients,
        pendingOrders,
        pendingRegistrationRequests,
        pendingDeletionRequests: totalPendingDeletionRequests,

        // Financial metrics
        platformCommission: totalPlatformCommission,
        totalProfits,
        profitGrowthRate: `${profitGrowthRate}%`,

        totalCompletedOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        currentMonthProfit,
        previousMonthProfit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getSystemAdminStatistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch system admin statistics",
      error: error.message,
    });
  }
};

module.exports = getSystemAdminStatistics;
