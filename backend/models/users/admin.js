import userModel from './user.js';

const AdminSchema= new mongoose.Schema({

})

const adminModel= userModel.discriminator("admin", AdminSchema); //discriminator key value must match role enum values.
export {userModel, adminModel};