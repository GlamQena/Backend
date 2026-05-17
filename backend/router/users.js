const express = require("express");
const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const getActiveClients = require("../controllers/users/getActiveClients");
const getUserById = require("../controllers/users/getUserById");
const rejectRequest = require("../controllers/admin/rejectRequest");
const getUsers = require("../controllers/users/getUsers");
const router = express.Router();

 router.use(checkAuth());
// router.use(checkRole("client"));
router.get("/",getUsers);

router.post("/me/wishlist", checkRole("client"), addToWishlist);
router.delete("/me/wishlist", checkRole("client"), removeFromWishlist);

router.get("/active-clients", checkRole("store_owner"), getActiveClients);

router.get("/:id", checkRole("admin"), getUserById);


router.patch("/reject-request/:id", checkRole("admin"), rejectRequest);

module.exports = router;
