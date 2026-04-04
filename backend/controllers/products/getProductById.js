const Product = require('../../models/Product');

const getProductById= async(req, res)=> {
     try {
    const { productId } = req.params;

    // جلب تفاصيل المنتج الواحد
    const product = await Product.findById(productId)
      .select('name description price images average_rating stock');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      results: 1,
      data: product
    });

  } catch (error) {
    console.error("getProductDetails error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

module.exports= getProductById;