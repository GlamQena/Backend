import { flattenObject } from '../../utils/helper/convertNestedObjToDotted.js';
import clientModel from '../../models/users/client.js';
import storeOwnerModel from '../../models/users/storeOwner.js';
import adminModel from '../../models/users/admin.js';

const editProfileController= async(req, res)=>{
try {
    const userId = req.user.id; 
    const userRole = req.user.role; 
    let updates = req.body;

    const forbiddenFields = [
      'password', 
      'role', 
      'email', 
      'isVerified', 
      'balance', 
      'permission', 
      'lastActivity'
    ];
    forbiddenFields.forEach(field => delete updates[field]);

    // convert Nested object To Dot Notation
    updates = flattenObject(updates);

    let model;
    
    
switch (userRole) {
      case 'client':
        model = clientModel;
        break;
      case 'store_owner':
        model = storeOwnerModel;
        break;
      case 'admin':
        model = adminModel;
        break;
      default:
        model = clientModel;
    }

    
    const updatedUser = await model.findByIdAndUpdate(
      userId,
      { $set: updates }, 
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser
    });

  } catch (error) {
    res.status(400).json({ 
      message: "Update failed", 
      error: error.message 
    });
}
}

module.exports= editProfileController;