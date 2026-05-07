const Order = require("../../models/order");
const { optionalEnumHandler } = require("../../validations/auth");

const setOrderStatusController = async(req, res) => {
    try{
        const status = req.query.status;
        const order_id = req.params.id;
        const userId = req.user.id;
        const userRole= req.user.role;

        if(!status)
            return res.status(400).json({message: "you must provide the status value"});

        if(userRole === "client" && status !== "ملغي")
            return res.status(403).json({message: "you're not allowed to change the order to another status than cancelled"});

        if(userRole === "store_owner" && (status ==="قيد التوصيل" || status === "تم التوصيل"))
            return res.status(403).json({message: "you're not allowed to change the order delivery status"});

        const foundOrder= await Order.findById(order_id);

        if(!foundOrder)
            return res.status(404).json({message: `order with id ${order_id} not found`});

        if(userRole === "client" && foundOrder.user_id !== userId)
            return res.status(403).json({message: "you're not allowed to change the status of another client order"});

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

        foundOrder.status = parsedStatus.data;
        await foundOrder.save();

        res.status(200).json({message: `order status updated to "${status}"`});
    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= setOrderStatusController;