const express= require("express");
const checkAuth = require('../middleware/checkAuth.js');
const getUserProfileController = require("../controllers/profile/getUserProfile.js");
const editProfileController= require('../controllers/profile/editProfile.js');
const deleteProfileController= require('../controllers/profile/deleteProfile.js');

const profileRouter= express.Router();

profileRouter.get("/", checkAuth, getUserProfileController);
profileRouter.put("/edit", checkAuth, editProfileController);
profileRouter.delete("/delete", checkAuth, deleteProfileController);

module.exports= profileRouter;