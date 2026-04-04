const Product = require('../../models/Product');

const getStoreProducts = async (req, res) => {
  try {
    const { storeId } = req.params; 

    // جلب المنتجات الخاصة بالمحل
    const products = await Product.find({ storeId })
      .select('name description price images average_rating'); 

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