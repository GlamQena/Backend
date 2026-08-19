const { flattenObject } = require('../../utils/helper/convertNestedObjToDotted.js');
const {clientModel} = require('../../models/users/client.js');
const {storeOwnerModel} = require('../../models/users/storeOwner.js');
const {adminModel} = require('../../models/users/admin.js');
const {clientProfile, storeOwnerProfile, adminProfile}= require("../../validations/profile.js");
const { setUserVerification } = require("../../utils/mailSender");

const editProfileController= async(req, res)=>{
try {
    const userId = req.user.id; 
    const userRole = req.user.role; 
    let updates = req.body;

    console.log("profile updates => ", updates);

    // const forbiddenFields = [
    //   'password', 
    //   'role', 
    //   'email', 
    //   'isVerified', 
    //   'balance', 
    //   'permission', 
    //   'lastActivity'
    // ];
    // forbiddenFields.forEach(field => delete updates[field]);

    // // convert Nested object To Dot Notation
    // updates = flattenObject(updates);

    let model;
    let parsedData;
    switch (userRole) {
      case 'client':
        parsedData= clientProfile.safeParse(updates);
        model = clientModel;
        break;
      case 'store_owner':
        parsedData= storeOwnerProfile.safeParse(updates);
        model = storeOwnerModel;
        break;
      case 'admin':
        parsedData= adminProfile.safeParse(updates);
        model = adminModel;
        break;
      default:
        parsedData= clientProfile.safeParse(updates);
        model = clientModel;
    }
    
    if(!parsedData.success)
      return res.status(400).json({message: parsedData.error.issues[0].message, field: parsedData.error.issues[0].path});

    const validatedData= parsedData.data;
    let updateQuery={
      $set: {},
      $unset: {}
    };

    Object.keys(validatedData).forEach((key)=>{
      if(validatedData[key] === undefined)
        updateQuery.$unset[key]="";
      else
        updateQuery.$set[key]= validatedData[key];
    });

    const currentUser= await model.findById(userId);

    let emailChanged= false;
    if(validatedData.email !== currentUser.email){
      updateQuery.$set["isEmailVerified"]= false;
      emailChanged= true;
    }

    if(Object.keys(updateQuery.$set) === 0)
      delete updateQuery.$set;

    if(Object.keys(updateQuery.$unset) === 0)
      delete updateQuery.$unset;

    if(Object.keys(updateQuery) === 0)
      return res.status(400).json({message: "no available data to update!"});

    // console.log("model-> ", model);
    const updatedUser = await model.findByIdAndUpdate(
      userId,
      updateQuery, 
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if(emailChanged)
      setUserVerification(updatedUser, "10m");

    res.status(200).json({
      message: `Profile updated successfully${emailChanged? ", verification link sent to your email": ""}`,
      user: updatedUser
    });

  } catch (error) {
    res.status(400).json({ 
      message: "Update failed", 
      error: error.message 
    });
}
}

module.exports= editProfileController;