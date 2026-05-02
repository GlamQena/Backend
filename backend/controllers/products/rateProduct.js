const productModel = require("../../models/product");
const {storeOwnerModel} = require("../../models/users/storeOwner");
const reviewModel = require("../../models/review");

const rateProductController= async(req, res)=> {
    try{
        let {rate, comment=""} = req.body;
        rate = Number(rate);
        const productId = req.params.id;
        const clientId = req.user.id;

        const foundProduct = await productModel.findById(productId);
        if(!foundProduct)
            return res.status(404).json({message: "product to be rated not found"});

        if(!rate)
            return res.status(400).json({message: "you must provide a rate [1:5] stars"});

        if(rate>5 || rate<1)
            return res.status(400).json({message: "rate must be in range [1:5] stars"});

        const store_owner = await storeOwnerModel.findById(foundProduct.owner_store_id);
        if(!store_owner)
            return res.status(404).json({message: "the owner store of the product to be rated not found"});

        let totalRates = store_owner.total_rates;
        let rates_Sum = store_owner.average_rating * totalRates;
        if(totalRates === 0)
            store_owner.average_rating = rate;
        else
            store_owner.average_rating = (rates_Sum + rate) / totalRates;
        store_owner.total_rates++;
        await store_owner.save();

        const savedReview = await reviewModel.create({
            client_id: clientId,
            product_id: productId,
            store_owner_id: store_owner._id,
            rate,
            comment,
        });

        res.status(201).json({message: "product rate saved successfully", savedReview});
    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= rateProductController;