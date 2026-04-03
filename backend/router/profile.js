const express= require("express");
const checkAuth = require('../middleware/checkAuth.js');
const getUserProfileController = require("../controllers/profile/getUserProfile.js");
const editProfileController= require('../controllers/profile/editProfile.js');
const changePasswordController= require('../controllers/profile/changePassword.js');
const deleteProfileController= require('../controllers/profile/deleteProfile.js');

const router= express.Router();

router.use(checkAuth);
router.get("/", getUserProfileController);
router.put("/edit", editProfileController);
router.patch("/change-password", changePasswordController);
router.delete("/delete", deleteProfileController);

module.exports= router;