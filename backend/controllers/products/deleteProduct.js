const Product = require('../../models/product');
const path = require("path");
const fs= require("fs");

const deleteProduct= async(req, res)=> {
  try {
    const  productId  = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const deletedProduct= await Product.findByIdAndDelete(productId, {new: true});
    deletedProduct.images.forEach(img => {
        const fullPath= path.join(__dirname, "../..", img);
        if(fs.existsSync(fullPath))
            fs.unlinkSync(fullPath);
    });

    res.status(200).json({
     success: true,
     message: "product deleted successfully"
    });

  } catch (error) {
    console.error("error deleting the product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

module.exports= deleteProduct;