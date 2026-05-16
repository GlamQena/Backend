const Order = require("../../models/order");
const userModel = require("../../models/users/user");
const { optionalEnumHandler } = require("../../validations/auth");

const setOrderStatusController = async(req, res) => {
    try{
        const status = req.query.status;
        const order_id = req.params.id;
        const user_id = req.user.id;
        const user_role = req.user.role;

        if(!status)
            return res.status(400).json({message: "you must provide the status value"});

        const foundOrder= await Order.findById(order_id);

        if(!foundOrder)
            return res.status(404).json({message: `order with id ${order_id} not found`});

        const orderStatuses = [
            "قيد الانتظار",
            "جاري التجهيز",
            "جاهز للتوصيل",
            "قيد التوصيل",
            "تم التوصيل",
            "ملغي",
        ];

        const statusZod= optionalEnumHandler(orderStatuses);

        const parsedStatus= statusZod.safeParse(status);
        if(!parsedStatus.success)
            return res.status(400).json({message: `${parsedStatus.error.issues[0].message}`});

        const user = await userModel.findById(user_id);

        if(status === "قيد التوصيل" || status === "تم التوصيل"){
            if (user_role !== "admin" || !user.permissions.includes("manageOrders"))
                return res.status(403).json({message: "you're not authorized to set delivery status"});
        }

        if((status === "جاري التجهيز" || status === "جاهز للتوصيل") && user_role !== "store_owner"){
            return res.status(403).json({message: "only store owners allowed to set this status"});
        }

        if(status === "ملغي" && (user_role !== "client" && user_role !== "admin")){
            return res.status(403).json({message: "you're not authorized to cancel the order"});
        }

        const newStatusIndex = orderStatuses.indexOf(status);
        const currentStatusIndex = orderStatuses.indexOf(foundOrder.status);

        if(status === "قيد الانتظار" && foundOrder.status !== "ملغي"){
            return res.status(400).json({message: "can't set uncancelled order to pending"});
        }
        else if(newStatusIndex <= currentStatusIndex)
            return res.status(400).json({message: "cann't set current order status to previous one"});

        foundOrder.status = status;
        await foundOrder.save();

        res.status(200).json({message: `order status updated to ${status}`});
    }catch(error){
        res.status(500).json({message: "internal server error", error});
    }
}

module.exports= setOrderStatusController;