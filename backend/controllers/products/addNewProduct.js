const Product = require("../../models/product")
const {storeOwnerModel} = require("../../models/users/storeOwner");
const path = require("path");

const addNewProductController = async (req, res) => {
    try {
        const ownerStoreId= req.user.id;

        if (!req.files || req.files.length < 3) {
            return res.status(400).json({ message: "Please upload at least 3 images" });
        }

        const imagePaths = req.files.map(file => file.path);

        const newProduct = await Product.create({
            ...req.body,
            images: imagePaths,
            owner_store_id: ownerStoreId
        });

        await storeOwnerModel.findByIdAndUpdate(ownerStoreId, {$inc:{total_products: 1}});

        res.status(201).json({message: "product created successfully", newProduct});
    } catch (error) {
        res.status(500).json({ message: "internal server error", error: error.message });
    };


};


module.exports = addNewProductController;