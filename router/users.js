const express = require("express");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const checkAdminPermissions = require("../middleware/checkAdminPermissions");

const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const getUserById = require("../controllers/users/getUserById");
const getUsers = require("../controllers/users/getUsers");
const addUser = require("../controllers/users/addUser");
const deleteUserController = require("../controllers/users/deleteUser");

const updateAdminPermissions = require("../controllers/users/updateAdminPermissions");
const getUserWishlist = require("../controllers/users/getUserWishlist");

const router = express.Router();

 router.use(checkAuth());

router.get("/me/wishlist", checkRole("client"), getUserWishlist);
router.post("/me/wishlist", checkRole("client"), addToWishlist);
router.delete("/me/wishlist", checkRole("client"), removeFromWishlist);

router.use(checkRole("admin"));

router.get("/", checkAdminPermissions(["manageUsers", "manageStores", "manageAdmins"]), getUsers);
router.get("/:id", checkAdminPermissions(["manageUsers", "manageStores", "manageAdmins"]), getUserById);
router.post("/", checkAdminPermissions(["manageStores", "manageAdmins"]), addUser);
router.delete("/:id", checkAdminPermissions(["manageStores", "manageAdmins"]), deleteUserController);

router.patch("/:id/permissions", checkAdminPermissions(["manageAdmins"]), updateAdminPermissions);

module.exports = router;
