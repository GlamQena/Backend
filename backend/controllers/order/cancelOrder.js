const Order = require("../../models/order");
const { optionalEnumHandler } = require("../../validations/auth");

const cancelOrderController = async(req, res) => {
    try{
        const order_id = req.params.id;
        const userRole= req.user.role;

        const foundOrder= await Order.findById(order_id);

        if(!foundOrder)
            return res.status(404).json({message: `order with id ${order_id} not found`});

        //TODO => search cancelling payment with paymob  https://chat.deepseek.com/share/hnyxnid1ca8wr8c582

        res.status(200).json({message: "order cancelled successfully"});
    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= cancelOrderController;