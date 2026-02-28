import userModel from './user.js';

const ClientSchema= new mongoose.Schema({

})

const clientModel= userModel.discriminator("client", ClientSchema);
export {userModel, clientModel};