const express = require("express");
const getUserWishlist = require("../controllers/user/getUserWishList");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.use(checkAuth);
router.get("/me/wishlist", getUserWishlist); //**the user id stored in cookie

module.exports = router;
