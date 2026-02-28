import userModel from './user.js';

const ShopOwnerSchema= new mongoose.Schema({

})

const shopOwnerModel= userModel.discriminator("shop_owner", ShopOwnerSchema);
export {userModel, shopOwnerModel};