const productModel = require("../../models/product");
const orderModel = require("../../models/order");
const {storeOwnerModel} = require("../../models/users/storeOwner");
const reviewModel = require("../../models/review");

const rateOrderProductController= async(req, res)=> {
    try{
        let {productId, rate, comment=""} = req.body;
        rate = Number(rate);
        const  orderId= req.params.id;
        const clientId = req.user.id;

        if(!productId || !rate)
            return res.status(400).json({message: "you must provide the product id and a rate [1:5] stars"});

        if(rate>5 || rate<1)
            return res.status(400).json({message: "rate must be in range [1:5] stars"});

        const foundProduct = await productModel.findById(productId);
        if(!foundProduct)
            return res.status(404).json({message: "product to be rated not found"});

        const store_owner = await storeOwnerModel.findById(foundProduct.owner_store_id);
        if(!store_owner)
            return res.status(404).json({message: "the owner store of the product to be rated not found"});

        const order = await orderModel.findById(orderId);
        if(!order)
            return res.status(404).json({message: "the order of the product to be rated not found"});

        if(order.user_id.toString() !== clientId.toString())
            return res.status(400).json({message: "you can only rate a product of order to you"});

        if(order.status !== "تم التوصيل")
            return res.status(400).json({message: "the order must be delivered to rate its product"});

        let storeOrderProducts= order.products.find((storeProds) => storeProds.owner_store_id.toString() === foundProduct.owner_store_id.toString())
        if (!storeOrderProducts)
            return res.status(400).json({ message: "product not found in this order" });

        const orderProductExists = storeOrderProducts.products.find((prod) => prod.prod_id.toString() === productId.toString());
        if(!orderProductExists)
            return res.status(400).json({message: "product not found in this order"});

        const foundReview = await reviewModel.findOne({client_id: clientId, product_id: productId});
        if(foundReview)
            return res.status(400).json({message: "you have rated this product before"});

        const savedReview = await reviewModel.create({
            client_id: clientId,
            product_id: productId,
            store_owner_id: store_owner._id,
            rate,
            comment: comment.trim(),
        });

        let totalRates = store_owner.total_rates;
        let rates_Sum = store_owner.average_rating * totalRates;
        if(totalRates === 0)
            store_owner.average_rating = rate;
        else
            store_owner.average_rating = (rates_Sum + rate) / totalRates;
        store_owner.total_rates++;
        await store_owner.save();

        const productStats= await reviewModel.aggregate([
            {$match: {product_id: productId}},
            {$group:{
                _id: null,
                avg:{$avg: "$rate"},
                count: {$sum: 1}
            }}
        ]);

        console.log("products stats result from review aggregation =>", productStats);

        if(productStats.length > 0){
            foundProduct.average_rating = productStats[0].avg;
            foundProduct.total_rates = productStats[0].count;
        }else{
            foundProduct.average_rating = rate;
            foundProduct.total_rates = 1;
        }

        await foundProduct.save();

        res.status(201).json({message: "product rate saved successfully", savedReview});
    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= rateOrderProductController;