const express = require("express");
const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const getActiveClients = require("../controllers/users/getActiveClients");
const getUserById = require("../controllers/users/getUserById");
const router = express.Router();

router.use(checkAuth());
// router.use(checkRole("client"));

router.post("/me/wishlist", checkRole("client"), addToWishlist);
router.delete("/me/wishlist", checkRole("client"), removeFromWishlist);

router.get("/active-clients", checkRole("store_owner"), getActiveClients);

router.get("/:id", checkRole("admin"), getUserById);

module.exports = router;
