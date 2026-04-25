const Product = require('../../models/product');
const {storeOwnerModel} = require("../../models/users/storeOwner");
const path = require("path");
const fs= require("fs");

const deleteProduct= async(req, res)=> {
  try {
    const  productId  = req.params.id;
    const storeOwnerId= req.user.id;

    const product = await Product.findOne({_id: productId, owner_store_id: storeOwnerId});

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

    await storeOwnerModel.findByIdAndUpdate(ownerStoreId, {$inc:{total_products: -1}});

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