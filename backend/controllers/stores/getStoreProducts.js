const Product = require('../../models/product');

const getStoreProducts = async (req, res) => {
  try {
    const storeId = req.params.id; 

    // جلب المنتجات الخاصة بالمحل
    const products = await Product.find({ owner_store_id: storeId })
      .select('name description price images average_rating stock'); 

    res.status(200).json({
      success: true,
      results: products.length,
      data: products
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
