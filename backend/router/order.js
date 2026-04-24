const express = require("express");
const checkPaymentCompletion = require("../controllers/order/checkPaymentCompletion");
const getOrderHistoryController = require("../controllers/order/getOrderHistory");
const paymentCheckoutController = require("../controllers/order/paymentCheckout");
const placeOrderController = require("../controllers/order/placeOrder");
const setOrderStatusController = require("../controllers/order/setOrderStatus");
const getOrderDetails = require("../controllers/order/getOrderDetails");
const getOrdersByOwnerStoreId = require("../controllers/order/getOrdersByOwnerStoreId");

const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const router = express.Router();

 //no checkAuth middleware to allow for paymob http requests 
router.post("/completion", checkPaymentCompletion);

router.use(checkAuth());
// router.use(checkRole("client"));

router.post("/", placeOrderController);
router.get("/history", getOrderHistoryController);
router.get("/",getOrdersByOwnerStoreId) // for owner store
router.post("/:id/payment", paymentCheckoutController);
router.patch("/:id/status", setOrderStatusController);
router.get("/:orderId", getOrderDetails)

module.exports = router;
