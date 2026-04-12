const Product = require('../../models/product');

const getProductById= async(req, res)=> {
     try {
    const  productId  = req.params.id;

    // جلب تفاصيل المنتج الواحد
    const product = await Product.findById(productId)
      .select('owner_store_id name description price images average_rating stock');

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