const productModel = require("../../models/product");
const orderModel = require("../../models/order");

const getSpecialProducts = async(req, res) => {
    try{
        const {status= "تم التوصيل", start_date, end_date, limit=5} = req.query;
        const matchConditions= {};

        if(start_date || end_date){
            matchConditions.createdAt= {};
            if(start_date)
                matchConditions.createdAt.$gte = new Date(start_date);
        }

        const products= await productModel.find(matchConditions).sort({createdAt: -1}).populate("owner_store_id", "store_name").select("_id name description price average_rate");
        const recentProducts= products.slice(0, parseInt(limit)-1);

        if(end_date)
            matchConditions.createdAt.$lte = new Date(end_date);

        matchConditions.status= status; //the status for filtering the frequently sold products from the orders with that status
        const frequentlySoldProducts = await orderModel.aggregate([
            {$match: matchConditions},

            {$unwind: "$products"},

            {$lookup: {
                from: "store_owners", 
                localField: "products.owner_store_id",
                foreignField: "_id",
                as: "store_info"
            }}, //lookup localField mustn't contain $

            {$unwind: {path: "$store_info", preserveNullAndEmptyArrays: true}},

            {$unwind: "$products.products"},

            {$lookup: {
                from: "product",
                localField: "products.products.prod_id",
                foreignField: "_id",
                as: "product_info"
            }}, 

            {$unwind: {path: "$product_info", preserveNullAndEmptyArrays: true}},
            
            {$group: {
                _id: {
                    product_id: "$products.products.prod_id",
                    store_id: "$products.owner_store_id"
                },
                store_name: {$first: "$store_info.store_name"},
                price: {$first: "$products.products.price"},
                name: {$first: "$products.products.name"},
                description: {$first: "$product_info.description"},
                average_rating: {$avg: "$product_info.average_rating"},
                totalQuantitySold: {$sum: "$products.products.quantity"},
            }},

            {$sort: {totalQuantitySold: -1}},

            {$limit: parseInt(limit)},

            {$project: {
                store_name: 1,
                product_id: 1,
                price: 1,
                name: 1,
                description: 1,
                average_rating: 1,
                totalQuantitySold: "$totalQuantitySold"
            }} 
        ]);

        return res.status(200).json({recentProducts, frequentlySoldProducts});

    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= getSpecialProducts;