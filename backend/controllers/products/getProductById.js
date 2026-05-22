const Product = require('../../models/product');
const reviewModel = require("../../models/review");

const getProductById= async(req, res)=> {
     try {
    const  productId  = req.params.id;

    // جلب تفاصيل المنتج الواحد
    const product = await Product.findById(productId)
      .select('owner_store_id name description price images hasReviewed average_rating total_rates stock');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const productReviews= await reviewModel.find({product_id: productId})
    .populate("client_id", "firstName lastName");
    
    res.status(200).json({
      success: true,
      results: 1,
      data: {
        product,
        reviews: productReviews
      }
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