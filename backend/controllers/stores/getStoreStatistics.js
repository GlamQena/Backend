const Product = require('../../models/product');
const Order = require('../../models/order');
const {storeOwnerModel} = require("../../models/users/storeOwner");

const getStoreStatistics = async (req, res) => {
  try {
    const storeId = req.params.id;

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    //  أحدث الطلبات 
    const latestOrders = await Order.find({"products.owner_store_id": storeId})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('user_id', 'name')
      .select('_id products total_price status createdAt');

    //  كل الطلبات 
    const orders = await Order.find({ "products.owner_store_id": storeId });

    //  كل المنتجات
    const products = await Product.find({ owner_store_id: storeId });

    // الطلبات الحالية
   const currentOrders = await Order.countDocuments({
      "products.owner_store_id": storeId,
       status: { $in: ["pending", "processing"] }
    });

    // منتجات قليلة المخزون
    const lowStockProducts = await Product.countDocuments({
      owner_store_id: storeId,
      stock: { $lte: 5 }
    });

    //  العملاء المتفاعلون
    const interactiveClientsCount = store.interactive_clients?.length || 0;

    // إجمالي المبيعات
    let totalSales = 0;
    for (let order of orders) {
      totalSales += order.totalPrice || 0;
    }

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