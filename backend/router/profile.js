const express= require("express");
const checkAuth = require('../middleware/checkAuth.js');
const getUserProfileController = require("../controllers/profile/getUserProfile.js");
const editProfileController= require('../controllers/profile/editProfile.js');
const changePasswordController= require('../controllers/profile/changePassword.js');
const {upload, checkDuplicateAndSave}= require("../utils/upload.js");
const uploadImageController = require("../controllers/profile/uploadImage.js");

const router= express.Router();

router.use(checkAuth());

router.get("/", getUserProfileController);
router.put("/edit", upload.fields([
    {name: "notifications", maxCount: 3}, 
    {name: "skinConcerns", maxCount: 5}
]),  editProfileController);
router.patch("/avatar", upload.single("image"), checkDuplicateAndSave, uploadImageController);
router.patch("/change-password", changePasswordController);
//TODO=> requestForDeletin route

module.exports= router;