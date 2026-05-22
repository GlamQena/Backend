const express = require("express");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const approveRequestDeletion = require("../controllers/admin/approveRequestDeletion");
const rejectRequest = require("../controllers/admin/rejectRequest");
const pendingRequest = require("../controllers/admin/pendingRequest");
const getSystemAdminStatistics = require("../controllers/admin/getSystemAdminStatistics");

const router= express.Router();

router.use(checkAuth());

router.get("/statistics",checkRole("admin"),getSystemAdminStatistics)
router.patch("/reject-request/:id", checkRole("admin"), rejectRequest); //deletion / registration
router.patch("/approve-deletion/:id",checkRole("admin"), approveRequestDeletion);// after approve go to delete end point (click delete button in frontend)
router.patch("/pending-deletion/:id",checkRole("admin"), pendingRequest) // if admin change his opinion after approve (click cancel button in frontend instead of delete button) return to pending 

module.exports= router;