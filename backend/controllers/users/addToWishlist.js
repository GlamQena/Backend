const productModel = require("../../models/product");
const {clientModel} = require("../../models/users/client");

const addToWishlist= async (req, res) => {
    try{
        const clientId= req.user.id;
        const {productId} =  req.query;

        if(req.user.role !== "client")
            return res.status(400).json({message: "only clients can add products to their wishlist"});

        let foundProduct= await productModel.findById(productId);

        if(!foundProduct)
            return res.status(404).json({message: "product not found"});

        let foundClient= await clientModel.findById(clientId);

        if(!foundClient)
            return res.status(404).json({message: "client not found"});

        const foundWishlistProduct = foundClient.wishlist.find((wish) => wish.productId.toString() === productId.toString());

        if(foundWishlistProduct)
            return res.status(400).json({message: "product already exist in your wishlist"});

        const updatedClientData= await clientModel.findByIdAndUpdate(
            clientId, 
            {$push:{wishlist: {
                productId: productId, 
                productName: foundProduct.name, 
                price: foundProduct.price, 
                addedAt: new Date(),
                inStock: foundProduct.stock > 0, 
                image: foundProduct.images[0]}}},
            {new: true}
        );

        if(!updatedClientData)
            return res.status(404).json({message: "error adding product to the client wishlist"});

        console.log("user data after addToWishlist => ", updatedClientData);
        res.status(200).json({message: "product added to wishlist", user: updatedClientData});

    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= addToWishlist;