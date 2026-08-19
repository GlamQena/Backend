const productModel = require("../../models/product");
const orderModel = require("../../models/order");

const getSpecialProducts = async(req, res) => {
    try{
        const {status= "قيد الانتظار", start_date, end_date, limit=5} = req.query;
        
        // Get recent products
        const products = await productModel.find()
            .sort({createdAt: -1})
            .populate("owner_store_id", "store_name")
            .select("_id name description price images average_rating");
        const recentProducts = products.slice(0, parseInt(limit));

        // Build match conditions for orders
        const orderMatchConditions = { 
            status: status  // Note: this is order status, not payment status
        };

        if(start_date || end_date){
            orderMatchConditions.createdAt = {};
            if(start_date)
                orderMatchConditions.createdAt.$gte = new Date(start_date);
            if(end_date)
                orderMatchConditions.createdAt.$lte = new Date(end_date);
        }

        // Debug
        const ordersCount = await orderModel.countDocuments(orderMatchConditions);
        console.log(`Found ${ordersCount} orders with conditions:`, JSON.stringify(orderMatchConditions));

        const frequentlySoldProducts = await orderModel.aggregate([
            { $match: orderMatchConditions },
            
            // First unwind: the outer products array (stores)
            { $unwind: "$products" },
            
            // Second unwind: the inner products array (actual products in each store)
            { $unwind: "$products.products" },
            
            // Lookup product details
            { $lookup: {
                from: "products",  // Note: 'products' (plural)
                localField: "products.products.prod_id",
                foreignField: "_id",
                as: "product_info"
            }},
            
            { $unwind: { 
                path: "$product_info", 
                preserveNullAndEmptyArrays: true  // Keep even if product deleted
            }},
            
            // Filter out products that don't exist in the product collection (in db)
            { $match: {
                "product_info": { $ne: null }  // ← Only keep products that exist
            }},

            // Lookup store details
            { $lookup: {
                from: "users", //lookup in the base collection not the discriminated one itself
                localField: "products.owner_store_id",
                foreignField: "_id",
                as: "store_info"
            }},
            
            { $unwind: { 
                path: "$store_info", 
                preserveNullAndEmptyArrays: true 
            }},
            
            // Group by product ID to sum quantities
            { $group: {
                _id: "$products.products.prod_id",
                store_id: { $first: "$products.owner_store_id" },
                store_name: { $first: "$store_info.store_name" },
                price: { $first: "$products.products.price" },
                name: { $first: { $ifNull: ["$product_info.name", "$products.products.name"] } }, 
                description: { $first: "$product_info.description" },
                images: { $first: "$product_info.images" },
                average_rating: { $first: "$product_info.average_rating" },
                totalQuantitySold: { $sum: "$products.products.quantity" }
            }},
            
            { $sort: { totalQuantitySold: -1 } },
            
            { $limit: parseInt(limit) },
            
            { $project: {
                _id: 1,
                store_id: 1,
                store_name: 1,
                price: 1,
                name: 1,
                description: 1,
                images: 1,
                average_rating: 1,
                totalQuantitySold: 1
            }}
        ]);

        console.log(`Found ${frequentlySoldProducts.length} frequently sold products`);

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