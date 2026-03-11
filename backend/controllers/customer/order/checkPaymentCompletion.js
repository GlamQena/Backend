const checkPaymentCompletion= async(req, res)=>{
    const {success, order}= req.body.obj;
    console.log("req body-> ", req.body);

    if(!success){
        console.log("payment checkout failed!");
        //update order and payment models status to canceled and failed respectively
    }
    else{
        console.log("payment completed successfully for order ", order.id);
        res.status(200).end("OK");
        //edit developer integration in paymob platform to redirect user to the front-end page display the receipt (integration response callback)
    }
}

module.exports= checkPaymentCompletion