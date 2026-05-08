const express = require("express");
const checkPaymentCompletion = require("../controllers/order/checkPaymentCompletion");
const getOrderHistoryController = require("../controllers/order/getOrderHistory");
const paymentCheckoutController = require("../controllers/order/paymentCheckout");
const placeOrderController = require("../controllers/order/placeOrder");
const setOrderStatusController = require("../controllers/order/setOrderStatus");
const getOrderDetailsController = require("../controllers/order/getOrderDetails");
const getOrdersByOwnerStoreId = require("../controllers/order/getOrdersByOwnerStoreId");
const cancelOrderController = require("../controllers/order/cancelOrder");

const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const router = express.Router();

 //no checkAuth middleware to allow for paymob http requests 
router.post("/completion", checkPaymentCompletion);

router.use(checkAuth());

router.patch("/:id/status", setOrderStatusController);

router.use(checkRole("client"));
router.post("/", placeOrderController);
router.get("/history", getOrderHistoryController);
router.post("/:id/payment", paymentCheckoutController);

router.use(checkRole(["client", "store_owner"]));
router.get("/:id", getOrderDetailsController) //for both storeOwner and client

router.use(checkRole("store_owner"));
router.get("/", getOrdersByOwnerStoreId) // for owner store

router.use(checkRole(["client", "admin"]));
router.patch("/:id/cancel", cancelOrderController);

module.exports = router;
