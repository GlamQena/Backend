const express= require("express");
const checkAuth = require('../middleware/checkAuth.js');
const getUserProfileController = require("../controllers/profile/getUserProfile.js");
const editProfileController= require('../controllers/profile/editProfile.js');
const deleteProfileController= require('../controllers/profile/deleteProfile.js');

const profileRouter= express.Router();

router.get("/profile/", getUserProfileController);
router.put("/profile/edit", checkAuth, editProfileController);
router.delete("/profile/delete", deleteProfileController);

module.exports= profileRouter;