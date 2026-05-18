const express = require("express");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const getUserById = require("../controllers/users/getUserById");
const getUsers = require("../controllers/users/getUsers");
const addUser = require("../controllers/users/addUser");
const deleteUserController = require("../controllers/users/deleteUser");

const router = express.Router();

 router.use(checkAuth());

router.post("/me/wishlist", checkRole("client"), addToWishlist);
router.delete("/me/wishlist", checkRole("client"), removeFromWishlist);

router.get("/", checkRole("admin"), getUsers);
router.get("/:id", checkRole("admin"), getUserById);
router.post("/",checkRole("admin"),addUser)
router.delete("/:id",checkRole("admin"),deleteUserController)

module.exports = router;
