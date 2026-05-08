const orderModel = require("../../models/order");


const checkPaymentCompletion= async(req, res)=>{
    const {success, order}= req.body.obj;
    console.log("req body-> ", req.body);

    const foundOrder= await orderModel.findOne({"payment.paymob_order_id": order.id});

    if(!foundOrder)
        console.error(`order with paymob id ${order.id} not found`);
    
    if(!success){
        console.error("payment checkout failed!");

        foundOrder.status= "ملغي";
        foundOrder.payment.status= "فشل";
        await foundOrder.save();

        res.status(400).end("failed");
    }
    else{
        console.log("payment completed successfully for order ", order.id);

        await clientModel.findByIdAndUpdate(foundOrder.user_id, {isEmailVerified: true});
        
        foundOrder.payment.status= "مكتمل";
        foundOrder.payment.completedAt= new Date();
        await foundOrder.save();

        res.status(200).end("OK");
    }
}

module.exports= checkPaymentCompletion