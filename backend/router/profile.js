const express= require("express");
const checkAuth = require('../middleware/checkAuth.js');
const getUserProfileController = require("../controllers/profile/getUserProfile.js");
const editProfileController= require('../controllers/profile/editProfile.js');
const changePasswordController= require('../controllers/profile/changePassword.js');
const deleteProfileController= require('../controllers/profile/deleteProfile.js');

const profileRouter= express.Router();

profileRouter.use(checkAuth);
profileRouter.get("/", getUserProfileController);
profileRouter.put("/edit", editProfileController);
profileRouter.patch("/change-password", changePasswordController);
profileRouter.delete("/delete", deleteProfileController);

module.exports= profileRouter;