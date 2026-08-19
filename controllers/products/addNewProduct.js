const categoryModel = require("../../models/category");
const Product = require("../../models/product")
const {storeOwnerModel} = require("../../models/users/storeOwner");
const path = require("path");
const { productSchema } = require("../../validations/products");

const addNewProductController = async (req, res) => {
    try {
        const ownerStoreId = req.user.id;
        let productData = req.body;

        console.log("new product data come from request => ", req.body);
        console.log("add new product request files => ", req.files);
        
        const uploadedUrls = req.uploadedUrls;

        if (!uploadedUrls || uploadedUrls.length < 1) {
            return res.status(400).json({ message: "Please upload at least 1 image" });
        }

        productData["images"] = uploadedUrls;

        // Parse JSON strings safely
        let dimensions = { length: 15, width: 10, height: 5 };
        let ingredients = [];
        
        try {
            dimensions = JSON.parse(productData.dimensions);
        } catch(e) {
            console.log("Error parsing dimensions, using defaults:", e);
        }
        
        try {
            ingredients = JSON.parse(productData.ingredients);
        } catch(e) {
            console.log("Error parsing ingredients, using empty array:", e);
        }
        
        console.log("dimensions =>", dimensions);

        const enhancedProductData = {
            ...productData,
            ingredients: ingredients,
            price: Number(productData.price), 
            stock: Number(productData.stock), 
            weight: Number(productData.weight),
            dimensions: {
                width: Number(dimensions.width) || 10,
                height: Number(dimensions.height) || 5,
                length: Number(dimensions.length) || 15,
            }
        };

        const parsedData = productSchema.safeParse(enhancedProductData);
        if(!parsedData.success){
            const zodErrors= parsedData.error?.issues?.map(err =>
                ({field: err.path.join("."), message: err.message}));

            console.log("zod error -> ", zodErrors);
            return res.status(400).json({
                message: `${parsedData.error.issues[0].message}`,
                errors: zodErrors
            });
        }

        const newProduct = await Product.create({
            ...parsedData.data,
            category_id: productData.category_id,
            images: uploadedUrls,
            owner_store_id: ownerStoreId
        });

        await storeOwnerModel.findByIdAndUpdate(ownerStoreId, {$inc: {total_products: 1}});
        await categoryModel.findByIdAndUpdate(newProduct.category_id, {$inc: {totalProducts: 1}});

        res.status(201).json({message: "product created successfully", newProduct});
    } catch (error) {
        console.log("server error => ", error.message);
        res.status(500).json({ message: "internal server error", error: error.message });
    }
};

module.exports = addNewProductController;