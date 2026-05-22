const mongoose = require("mongoose");
const Product = require('../../models/product');
const Order = require('../../models/order');
const {storeOwnerModel} = require("../../models/users/storeOwner");

const getStoreStatistics = async (req, res) => {
  try {
    const storeId = req.user.id;
    const store = await storeOwnerModel.findById(storeId).select("-deletion_requested -deletion_status");

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    //  أحدث الطلبات 
    const latestOrders = await Order.find({"products.owner_store_id": storeId})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user_id', 'firstName lastName')
      .select('_id products total_price status createdAt');

    //  كل الطلبات 
    const orders = await Order.find({ "products.owner_store_id": storeId });

    //  كل المنتجات
    // const products = await Product.find({ owner_store_id: storeId });

    // الطلبات الحالية
   const currentOrders = await Order.countDocuments({
      "products.owner_store_id": storeId,
       status: { $in: ["قيد الانتظار", "قيد المعالجة"] }
    });

    // منتجات قليلة المخزون
    const lowStockProducts = await Product.countDocuments({
      owner_store_id: storeId,
      stock: { $lte: 5 }
    });

    // العملاء المتفاعلون
    // إجمالي المبيعات
    let interactiveClients = [];
    let totalSales = 0;

    for (let order of orders) {
      totalSales += order.totalPrice || 0;

      const foundStoreProducts = order.products.find((s) => s.owner_store_id.toString() === storeId.toString());
      if( (foundStoreProducts || Object.keys(foundStoreProducts).length > 0) &&
         !interactiveClients.includes(order.user_id)
        )
         interactiveClients.push(order.user_id);
    }
    const interactiveClientsCount= interactiveClients.length;

    // عمولة المنصة
    const platformCommission = 0.15; 
    
    return res.status(200).json({
      store,
      latestOrders,
      analytics: {
        totalOrders: store.total_orders,
        totalProducts: store.total_products,
        currentOrders,
        lowStockProducts,
        avgRating: store.average_rating ?? 0,
        totalSales,
        platformCommission,
        interactiveClients: interactiveClientsCount
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = getStoreStatistics;