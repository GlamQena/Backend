const express= require("express");
const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const addUser = require("../controllers/users/addUser");

const router= express.Router();

router.use(checkAuth());

router.post("/me/wishlist", checkRole("client"),addToWishlist);
router.delete("/me/wishlist", checkRole("client"),removeFromWishlist);

router.post("/addUser",checkRole(["admin"]),addUser)

module.exports= router;
