 const { clientModel} = require("../../models/users/client");
 const { storeOwnerModel } = require("../../models/users/storeOwner");
 const  userModel  = require("../../models/users/user");
 const Cart = require("../../models/cart");
 const Product = require("../../models/product");
 const Order = require("../../models/order");
 const fs = require("fs");
 const path = require("path");
 
 const deleteProfileController= async(req, res)=>{
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    Cart.findOneAndDelete({user_id: userId});
    
    if(userRole === "client"){
      Order.deleteMany({user_id: userId});
    }

    // if (userRole === 'store_owner') {
    //   await Product.deleteMany({ owner_store_id: userId }); 
    // }

    const deletedUser = await userModel.findByIdAndDelete(userId);

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

module.exports= deleteProfileController;