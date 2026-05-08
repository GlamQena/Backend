const express= require("express");
const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");

const router= express.Router();

router.use(checkAuth());
router.use(checkRole("client"));

router.post("/me/wishlist", addToWishlist);
router.delete("/me/wishlist", removeFromWishlist);

module.exports= router;
