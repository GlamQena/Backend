 const { clientModel} = require("../../models/users/client");
 const { storeOwnerModel } = require("../../models/users/storeOwner");
 const  userModel  = require("../../models/users/user");
 const Cart = require("../../models/cart");
 const Product = require("../../models/product");
 const Order = require("../../models/order");
 const fs = require("fs");
 const path = require("path");
 
 const deleteUserController= async(req, res)=>{
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let deletedUser;

    if(userRole === "client"){
      Cart.findOneAndDelete({user_id: userId});
      Order.deleteMany({user_id: userId});
      deletedUser = await clientModel.findByIdAndDelete(userId);
    }

    // if (userRole === 'store_owner') {
    //   //TODO => check for the StoreOwner document existence and the property deletion_requested to be true and deletion_Status to be "approved" before deletion
    //   await Product.deleteMany({ owner_store_id: userId }); 
    // }

    //TODO => delete admin profile based on a request approval too
    //*if the request come from the admin [userRole === "admin"] with permission to manage Stores or admin then no need to check for the deletion_request

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const avatarPath= path.join(__dirname, "../../", deletedUser.image);
    if(fs.existsSync(avatarPath))
      fs.unlinkSync(avatarPath);
    
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Profile and all related data deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }

}

module.exports= deleteUserController;