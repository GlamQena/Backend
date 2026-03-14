 import { clientModel} from "../../models/users/client";
 import { storeOwnerModel } from "../../models/users/storeOwner";
 import { userModel } from "../../models/users/user";
 import Cart from "../../models/cart";
 import Product from "../../models/product";
 
 const deleteProfileController= async(req, res)=>{
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'client') {
      const clientData = await clientModel.findById(userId);
      if (clientData && clientData.cart_id) {
        await Cart.findByIdAndDelete(clientData.cart_id);
      }
    } 
    //handle the relation between store owner and user because this code will cause logical bug
    // else if (userRole === 'store_owner') {
    //   await Product.deleteMany({ owner_store_id: userId }); 
    // }

    const deletedUser = await userModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.clearCookie("token");

    res.status(200).json({
      message: "Profile and all related data deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }

}

module.exports= deleteProfileController;