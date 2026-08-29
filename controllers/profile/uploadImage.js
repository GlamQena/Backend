 const  userModel  = require("../../models/users/user");
 
 const uploadImageController= async(req, res)=>{
  try {
    const userId = req.user.id;

    const user= await userModel.findById(userId);
    if(!user)
        return res.status(404).json({message: "user account not found"});

    if(!req.uploadedUrl){
      return res.status(400).json({message: "image file must be provided"});
    }

    if(!req.uploadedHash){
      return res.status(400).json({message: "image validation failed. the file hash not provided"});
    }

    console.log("avatar image file => ", req.uploadedUrl);

    if(user.avatar){
      await deleteImageFromCloudinary(user.avatar);
    }

    user.avatar = req.uploadedUrl;
    user.avatar_hash = req.uploadedHash;
    await user.save();

    res.status(200).json({message: "avatar image uploaded successfully", imagePath: user.avatar});
  } catch (error) {
    res.status(500).json({ message: "error uploading profile avatar", error: error.message });
  }

}

module.exports= uploadImageController;