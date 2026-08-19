const Order = require("../../models/order");
const userModel = require("../../models/users/user");
const { sendEmail, sendEmailMessage } = require("../../utils/mailSender");
const { optionalEnumHandler } = require("../../validations/auth");

const setOrderStatusController = async(req, res) => {
    try{
        const status = req.query.status;
        const order_id = req.params.id;
        const user_id = req.user.id;
        const user_role = req.user.role;

        if(!status) {
            return res.status(400).json({message: "you must provide the status value"});
        }

        const foundOrder = await Order.findById(order_id);

        if(!foundOrder) {
            return res.status(404).json({message: `order with id ${order_id} not found`});
        }

        // FIXED: Use foundOrder instead of order
        const orderUser = await userModel.findById(foundOrder.user_id);

        if(!orderUser) {
            return res.status(400).json({message: "the client who own this order wasn't found"});
        }

        const orderStatuses = [
            "قيد الانتظار",
            "جاري التجهيز",
            "جاهز للتوصيل",
            "قيد التوصيل",
            "تم التوصيل",
            "ملغي",
        ];

        const statusZod = optionalEnumHandler(orderStatuses);
        const parsedStatus = statusZod.safeParse(status);
        
        if(!parsedStatus.success) {
            return res.status(400).json({message: `${parsedStatus.error.issues[0].message}`});
        }

        const user = await userModel.findById(user_id);

        // FIXED: Proper permission checks
        if((status === "قيد التوصيل" || status === "تم التوصيل") && 
           (user_role !== "admin" || !user.permission?.includes("manageOrders"))) {
            return res.status(403).json({message: "you're not authorized to set delivery status"});
        }

        if(status === "تم التوصيل"){
            if(foundOrder.payment.method === "cash") {
                foundOrder.payment.status = "مكتمل";
            } else if((foundOrder.payment.method === "card" || foundOrder.payment.method === "wallet") && 
                      foundOrder.payment.status !== "مكتمل") {
                return res.status(400).json({message: "can't set order to delivered before payment is completed"});
            }
            foundOrder.deliveredAt= new Date();
        }

        if((status === "جاري التجهيز" || status === "جاهز للتوصيل") && user_role !== "store_owner"){
            return res.status(403).json({message: "only store owners allowed to set this status"});
        }

        if(status === "ملغي" && (user_role !== "client" && user_role !== "admin")){
            return res.status(403).json({message: "you're not authorized to cancel the order"});
        }

        const newStatusIndex = orderStatuses.indexOf(status);
        const currentStatusIndex = orderStatuses.indexOf(foundOrder.status);
        
        // Cancelled orders can be set to Pending only in reorder endpoint
        if(foundOrder.status === "ملغي") {
            return res.status(400).json({message: "cancelled orders cannot be modified"});
        }
        
        if(status === "قيد الانتظار") {
            return res.status(400).json({message: "can't set order to pending status"});
        }
        
        // if(status !== "ملغي") {
        //     if(newStatusIndex <= currentStatusIndex) {
        //         return res.status(400).json({message: "can't set current order status to previous one"});
        //     }
        //     if(newStatusIndex - currentStatusIndex !== 1) {
        //         return res.status(400).json({message: "the order status must follow the normal flow (one step at a time)"});
        //     }
        // } //commented temporarily for test easily

        foundOrder.status = status;
        await foundOrder.save();

        sendEmailMessage({to: orderUser.email, subject: "order status update", text: `your status have been updated from ${foundOrder.status} to ${status}`});
        res.status(200).json({message: `order status updated to ${status}`});
    } catch(error){
        console.error(error); // Added for debugging
        res.status(500).json({message: "internal server server error"});
    }
}

module.exports = setOrderStatusController;