const orderModel = require("../../models/order");
const { clientModel } = require("../../models/users/client");

const checkPaymentCompletion= async(req, res)=>{
    try{
        const {obj, type} = req.body;
        const {success, order}= obj;
        console.log("payment completion req body-> ", req.body);

        const foundOrder= await orderModel.findOne({"payment.paymob_order_id": order.id});

        if(!foundOrder)
            console.error(`order with paymob id ${order.id} not found`);
        
        if(!success){
            console.error("payment checkout failed!");

            foundOrder.status= "ملغي";
            foundOrder.payment.status= "فشل";
            await foundOrder.save();

            res.status(200).end("failed");  //payob expects status 200 even for failure
        }
        else{
            console.log("payment completed successfully for order ", order.id);

            await clientModel.findByIdAndUpdate(foundOrder.user_id, {isEmailVerified: true});
            
            foundOrder.payment.status= "مكتمل";
            if(type === "TRANSACTION")
                foundOrder.payment.paymob_transaction_id = obj.id;
            foundOrder.payment.completedAt= new Date();
            await foundOrder.save();

            res.status(200).end("OK");
        }
    }catch(error){
        console.error(error);
        res.status(200).end("failed");
    }
}

module.exports= checkPaymentCompletion