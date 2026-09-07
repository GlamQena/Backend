const Product = require('../../models/product');
const {storeOwnerModel} = require('../../models/users/storeOwner');

const getStoreProducts = async (req, res) => {
  try {
    const storeId = req.params.id; 
    console.log(storeId)

    // جلب المنتجات الخاصة بالمحل
    const products = await Product.find({ owner_store_id: storeId })
      .populate({path: "category_id", select: "_id name icon description"})
      // .populate({path: "owner_store_id", select: "store_name"})
      .select('name description price images average_rating total_rates stock skinType ingredients'); 

    const store = await storeOwnerModel.findById(storeId).select("store_name total_products average_rating total_rates total-orders logo");

    res.status(200).json({
      success: true,
      results: products.length,
      data: {store, products}
    });

  } catch (error) {
    console.error("getStoreProducts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = getStoreProducts;
