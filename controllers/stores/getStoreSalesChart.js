const mongoose = require("mongoose");
const Product = require('../../models/product');
const Order = require('../../models/order');
const {storeOwnerModel} = require("../../models/users/storeOwner");

const getStoreSalesChart = async (req, res) => {
  try {
    const storeId = req.user.id;
    const { period = '30' } = req.query; 
    const days = parseInt(period);

    const store = await storeOwnerModel.findById(storeId).select("-deletion_requested -deletion_status");

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    //aggregated sales
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const chartData = await Order.aggregate([
      {
        $match: {
          "products.owner_store_id": new mongoose.Types.ObjectId(storeId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {$unwind: "$products"},
      {
        $match: {
          "products.owner_store_id": new mongoose.Types.ObjectId(storeId)
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          total_sales: { $sum: "$products.store_subtotal" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Prepare arrays for chart
    const labels = [];
    const values = [];
    
    // Create a map of date -> sales
    const salesMap = new Map();
    chartData.forEach(item => {
      salesMap.set(item._id, item.total_sales);
    });

    // Fill all dates in range
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayNumber = currentDate.getDate();
      
      labels.push(dayNumber.toString()); // Just the day number: 1, 2, 3...
      values.push(salesMap.get(dateKey) || 0);
    }

    return res.status(200).json({
        store,
        chartData:{
        labels,
        values
        }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = getStoreSalesChart;