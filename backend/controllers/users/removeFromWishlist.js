const productModel = require("../../models/product");
const {clientModel} = require("../../models/users/client");

const removeFromWishlist= async (req, res) => {
    try{
        const clientId= req.user.id;
        const {productId} =  req.query;

        let foundProduct= await productModel.findById(productId);

        if(!foundProduct)
            return res.status(404).json({message: "product not found"});

        const updatedClientData= await clientModel.findByIdAndUpdate(
            clientId, 
            {$pull:{wishlist: {productId: productId}}},
            {new: true}
        ); //$unset for deleting a field from a document, while $pull for removing a document from array

        if(!updatedClientData)
            return res.status(404).json({message: "error removing product from the client wishlist"});

        console.log("user data after deleteFromWishlist => ", updatedClientData);
        res.status(200).json({message: "product removed from wishlist", updatedClientData});

    }catch(error){
        console.log("removeFromWishlist error => ", error.message);
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= removeFromWishlist;