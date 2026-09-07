 const  {storeOwnerModel}  = require("../../models/users/storeOwner.js");
 const {deleteImageFromCloudinary} = require("../../utils/upload.js")
 
 const uploadStoreLogoController= async(req, res)=>{
  try {
    const userId = req.user.id;

    const storeOwner= await storeOwnerModel.findById(userId);
    if(!storeOwner)
        return res.status(404).json({message: "store owner account not found"});

    if(!req.uploadedUrl){
      return res.status(400).json({message: "store logo file must be provided"});
    }

    if(!req.uploadedHash){
      return res.status(400).json({message: "store logo validation failed. the file hash not provided"});
    }

    console.log("store logo image file => ", req.uploadedUrl);

    if(storeOwner.logo && storeOwner.logo_hash !== req.uploadedHash){
      await deleteImageFromCloudinary(storeOwner.logo);
    }
    else if(storeOwner.logo && storeOwner.logo_hash == req.uploadedHash){
      return res.status(200).json({message: "Same image uploaded - No changes", path: storeOwner.logo});
    }

    storeOwner.logo = req.uploadedUrl;
    storeOwner.logo_hash = req.uploadedHash;
    await storeOwner.save();

    res.status(200).json({message: "logo image uploaded successfully", imagePath: storeOwner.logo});
  } catch (error) {
    res.status(500).json({ message: "error uploading store logo", error: error.message });
  }

}

module.exports= uploadStoreLogoController;