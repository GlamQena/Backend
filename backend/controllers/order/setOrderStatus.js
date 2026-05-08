const Order = require("../../models/order");
const { optionalEnumHandler } = require("../../validations/auth");

const setOrderStatusController = async(req, res) => {
    try{
        const status = req.query.status;
        const order_id = req.params.id;

        if(!status)
            return res.status(400).json({message: "you must provide the status value"});

        const foundOrder= await Order.findById(order_id);

        if(!foundOrder)
            return res.status(404).json({message: `order with id ${order_id} not found`});

        const statusZod= optionalEnumHandler([
                "قيد الانتظار",
                "جاري التجهيز",
                "قيد التوصيل",
                "ملغي",
                "تم التوصيل"
        ]);

        const parsedStatus= statusZod.safeParse(status);
        if(!parsedStatus.success)
            return res.status(400).json({message: `${parsedStatus.error.issues[0].message}`});

        res.status(200).json({message: `order status updated to "${status}"`});
    }catch(error){
        res.status(500).json({message: "internal server error", error});
    }
}

module.exports= setOrderStatusController;