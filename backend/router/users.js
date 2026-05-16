const express = require("express");
const addToWishlist = require("../controllers/users/addToWishlist");
const removeFromWishlist = require("../controllers/users/removeFromWishlist");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const getActiveClients = require("../controllers/users/getActiveClients");
const getUserById = require("../controllers/users/getUserById");
const rejectRequest = require("../controllers/admin/rejectRequest");
const getUsers = require("../controllers/users/getUsers");
const addUser = require("../controllers/users/addUser");
const deleteUserController = require("../controllers/users/deleteUser");
const approveRequestDeletion = require("../controllers/admin/approveRequestDeletion");
const pendingRequest = require("../controllers/admin/pendingRequest");
const router = express.Router();

 router.use(checkAuth());
// router.use(checkRole("client"));
router.get("/",getUsers);

router.post("/me/wishlist", checkRole("client"), addToWishlist);
router.delete("/me/wishlist", checkRole("client"), removeFromWishlist);

router.get("/active-clients", checkRole("store_owner"), getActiveClients);

router.get("/:id", checkRole("admin"), getUserById);

router.post("/addUser",checkRole("admin"),addUser)
router.delete("/:id",checkRole("admin"),deleteUserController)

router.patch("/reject-request/:id", checkRole("admin"), rejectRequest);
router.patch("/approve-request/:id",checkRole("admin"),approveRequestDeletion);// after approve go to delete end point (click delete button in frontend)
router.patch("/pending-request/:id",checkRole("admin"),pendingRequest) // if admin change his opinion after approve (click cancel button in frontend instead of delete button) return to pending 

module.exports = router;
