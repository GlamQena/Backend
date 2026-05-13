const Product = require('../../models/product');
const {storeOwnerModel} = require("../../models/users/storeOwner");
const path = require("path");
const fs= require("fs");
const orderModel = require('../../models/order');

const deleteProduct= async(req, res)=> {
  try {
    const  productId  = req.params.id;
    const storeOwnerId= req.user.id;

    const product = await Product.findOne({_id: productId, owner_store_id: storeOwnerId});

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found to delete"
      });
    }

    const productOrders= await orderModel.find({"products.owner_store_id": product.owner_store_id, "products.products.prod_id": productId});
    if(productOrders.length > 0) {
      return res.status(400).json({message: `can't delete this product, it has ${productOrders.length} associated orders. make inactive instead`});
    }


    const deletedProduct= await Product.findByIdAndDelete(productId, {new: true});  //if caused logical problems while accessing later make it inactive instead

    deletedProduct.images.forEach(img => {
        const fullPath= path.join(__dirname, "../..", img); //img format => /uploads/img_name
        if(fs.existsSync(fullPath))
            fs.unlinkSync(fullPath);
    });

    await cartModel.findOneAndUpdate({"products.owner_store_id": storeOwnerId, "products.products.prod_id": productId}, {$pull: {"products.$.products": {prod_id: productId}}});
    await storeOwnerModel.findByIdAndUpdate(ownerStoreId, {$inc:{total_products: -1}});
    await categoryModel.findByIdAndUpdate(deletedProduct.category_id, {$inc: {totalProducts: -1}});

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