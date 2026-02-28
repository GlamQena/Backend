import userModel from './user.js';

const DeliveryWorkerSchema= new mongoose.Schema({

})

const deliveryWorkerModel= userModel.discriminator("delivery_worker", DeliveryWorkerSchema);
export {userModel, deliveryWorkerModel};