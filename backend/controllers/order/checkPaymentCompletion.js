const orderModel = require("../../models/order");
const { clientModel } = require("../../models/users/client");
const { sendEmailMessage } = require("../../utils/mailSender");

const checkPaymentCompletion= async(req, res)=>{
    try{
        const {obj, type} = req.body;
        const {success, order}= obj;
        console.log("payment completion req body-> ", req.body);

        if(!obj || !obj.order)
            return console.error(`obj order from paymob not found`);

        const foundOrder= await orderModel.findOne({"payment.paymob_order_id": order.id});

        if(!foundOrder)
           return console.error(`order with paymob id ${order.id} not found`);
        
        if(!success){
            console.error("payment checkout failed!");

            foundOrder.status= "ملغي";
            foundOrder.payment.status= "فشل";
            await foundOrder.save();
            sendEmailMessage({to: updatedClient.email, subject: "payment failed", text: `sorry to say that your payment failed, try again later`});
            return res.status(200).end("failed");  //payob expects status 200 even for failure
        }

        console.log("payment completed successfully for order ", order.id);

        const updatedClient =await clientModel.findByIdAndUpdate(foundOrder.user_id, {$set: {isEmailVerified: true}, $inc: {totalSpent: foundOrder.total_price}});
        
        foundOrder.payment.status= "مكتمل";
        if(type === "TRANSACTION")
            foundOrder.payment.paymob_transaction_id = obj.id;
        foundOrder.payment.completedAt= new Date();
        await foundOrder.save();

        sendEmailMessage({to: updatedClient.email, subject: "payment completed", text: `<a href= "http://127.0.0.1:3000/orders">track your order history</a>`});
        res.status(200).end("OK");
    }catch(error){
        console.error(error);
        res.status(200).end("failed");
    }
}

module.exports= checkPaymentCompletion