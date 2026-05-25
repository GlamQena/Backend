const productModel = require("../../models/product");
const {clientModel} = require("../../models/users/client");

const removeFromWishlist= async (req, res) => {
    try{
        const clientId= req.user.id;
        const {productId} =  req.query;

        let foundProduct= await productModel.findById(productId);

        if(!foundProduct)
            return res.status(404).json({message: "product not found"});

        let foundClient= await clientModel.findById(clientId);
        
        if(!foundClient)
            return res.status(404).json({message: "client not found"});

        let productWishExist= false;
        foundClient.wishlist.forEach(wish => {
            if(wish.productId.toString() === productId.toString())
                productWishExist= true;
        });

        if(!productWishExist)
            return res.status(404).json({message: "the product wasn't found in the wishlist"});

        foundClient.wishlist= foundClient.wishlist.filter(w => w.productId.toString() !== productId.toString());

        await foundClient.save();

        console.log("user data after deleteFromWishlist => ", foundClient);
        res.status(200).json({message: "product removed from wishlist", user: foundClient});

    }catch(error){
        console.log("removeFromWishlist error => ", error.message);
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= removeFromWishlist;