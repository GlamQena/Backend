const productModel = require("../../models/product");
const orderModel = require("../../models/order");

const getSpecialProducts = async(req, res) => {
    try{
        const {status= "قيد الانتظار", start_date, end_date, limit=5} = req.query;
        
        // Get recent products - NO status filter here
        const products = await productModel.find()
            .sort({createdAt: -1})
            .populate("owner_store_id", "store_name")
            .select("_id name description price images average_rating");
        const recentProducts = products.slice(0, parseInt(limit));

        // Get frequently sold products - WITH status filter for orders
        const orderMatchConditions = { status: status };

        if(start_date || end_date){
            orderMatchConditions.createdAt = {};
            if(start_date)
                orderMatchConditions.createdAt.$gte = new Date(start_date);
            if(end_date)
                orderMatchConditions.createdAt.$lte = new Date(end_date);
        }

         const ordersCount = await orderModel.countDocuments({ status: status });
        console.log(`Found ${ordersCount} orders with status "${status}"`);

        const frequentlySoldProducts = await orderModel.aggregate([
            { $match: orderMatchConditions },
            
            { $unwind: "$products" },
            
            { $unwind: "$products.products" },
            
            { $lookup: {
                from: "product",
                localField: "products.products.prod_id",
                foreignField: "_id",
                as: "product_info"
            }},
            
            { $unwind: { path: "$product_info", preserveNullAndEmptyArrays: false } },
            
            { $lookup: {
                from: "store_owner",
                localField: "products.owner_store_id",
                foreignField: "_id",
                as: "store_info"
            }},
            
            { $unwind: { path: "$store_info", preserveNullAndEmptyArrays: false } },
            
            { $group: {
                _id: {
                    product_id: "$products.products.prod_id",
                    store_id: "$products.owner_store_id"
                },
                store_name: { $first: "$store_info.store_name" },
                price: { $first: "$products.products.price" },
                name: { $first: "$product_info.name" },
                description: { $first: "$product_info.description" },
                images: { $first: "$product_info.images" },
                average_rating: { $first: "$product_info.average_rating" },
                totalQuantitySold: { $sum: "$products.products.quantity" }
            }},
            
            { $sort: { totalQuantitySold: -1 } },
            
            { $limit: parseInt(limit) },
            
            { $project: {
                _id: "$_id.product_id",
                store_id: "$_id.store_id",
                store_name: 1,
                price: 1,
                name: 1,
                description: 1,
                images: 1,
                average_rating: 1,
                totalQuantitySold: 1
            }}
        ]);

        return res.status(200).json({ 
            success: true,
            recentProducts, 
            frequentlySoldProducts 
        });

    } catch(error){
        console.error("Error in getSpecialProducts:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: error.message 
        });
    }
}

module.exports= getSpecialProducts;