const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");

const getSystemAdminStatistics = async (req, res) => {
  try {
    // Get period from query params (default: 12 months)
    const period = parseInt(req.query.period) || 12; // months
    const currentDate = new Date();
    
    // Calculate start date based on period
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - period + 1,
      1
    );
    
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // 1. Aggregate profits per month (including product profits + delivery fees)
    const monthlyProfits = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
          totalProfit: { 
            $sum: { 
              $add: [
                "$profit_breakdown.platform_revenue.products",
                "$profit_breakdown.platform_revenue.delivery"
              ]
            } 
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Prepare chart data arrays (same format as getStoreSalesChart)
    const labels = [];
    const values = [];
    
    // Create a map for quick lookup
    const profitMap = new Map();
    monthlyProfits.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      profitMap.set(key, item.totalProfit);
    });

    // Fill all months in the period
    for (let i = 0; i < period; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthName = date.toLocaleString('ar-EG', { month: 'long' });
      
      labels.push(`${monthName} ${year}`);
      
      const key = `${year}-${month}`;
      values.push(profitMap.get(key) || 0);
    }

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

    // 8. Calculate total profits including delivery fees
    const totalProfitsAgg = await orderModel.aggregate([
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
            $sum: { 
              $add: [
                "$profit_breakdown.platform_revenue.products",
                "$profit_breakdown.platform_revenue.delivery"
              ]
            },
          },
        },
      },
    ]);

    const totalProfits = totalProfitsAgg[0]?.totalPlatformCommission || 0;

    // 9. Calculate profit growth rate in the last month (%)
    const lastMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

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
          total: { 
            $sum: { 
              $add: [
                "$profit_breakdown.platform_revenue.products",
                "$profit_breakdown.platform_revenue.delivery"
              ]
            } 
          },
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
          total: { 
            $sum: { 
              $add: [
                "$profit_breakdown.platform_revenue.products",
                "$profit_breakdown.platform_revenue.delivery"
              ]
            } 
          },
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
      profitGrowthRate = 100;
    }

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
        // Chart data in the same format as getStoreSalesChart
        chartData: {
          labels: labels,    // Array of month names
          values: values     // Array of profit values
        },

        // Counts
        activeStores,
        activeCategories,
        clients,
        pendingOrders,
        pendingRegistrationRequests,
        pendingDeletionRequests: totalPendingDeletionRequests,

        // Financial metrics
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