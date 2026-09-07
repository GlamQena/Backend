const Product = require('../../models/product');
const reviewModel = require("../../models/review");

const getProductById= async(req, res)=> {
     try {
    const  productId  = req.params.id;

    const product = await Product.findOne({ _id: productId, isActive: true })
    .populate('owner_store_id', "store_name logo")
    .populate("category_id", "name")
    .lean()
    .exec();
      // .select('owner_store_id name description price images hasReviewed average_rating total_rates stock');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    console.log('Product owner_store_id:', product?.owner_store_id);
    console.log('Product owner_store_id type:', typeof product?.owner_store_id); 
    console.log(`populated product: ${JSON.stringify(product)}`);

    const productReviews= await reviewModel.find({product_id: productId, isActive: true})
    .populate("client_id", "avatar firstName lastName");

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