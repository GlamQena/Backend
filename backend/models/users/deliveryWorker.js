import userModel from './user.js';

const DeliveryWorkerSchema= new mongoose.Schema({
    vehicleType:{
        type: String,
        enum: ["motorcycle", "car", "public_transit", "other"],
        required: true,
        index:1,
    },
    licensePlate:{
        type: String,
        default: null,
        index:1,
    },
    rating:{
        type: Number,
        min:0,
        max:5,
        default:0,
    },
    totalOrders:{
        number: Number,
        mi:0,
        default:0,
        index: true,
    },
    deliveredOrders:{
        type:[{type:mongoose.Schema.Types.ObjectId, ref: 'order', index: true}],
    },
    currentDelivery:{type:mongoose.Schema.Types.ObjectId, ref: 'order',},
    isAvailable:{
        type: Boolean,
        default: false,
    }
});

const deliveryWorkerModel= userModel.discriminator("delivery_worker", DeliveryWorkerSchema);
module.exports= {userModel, deliveryWorkerModel};