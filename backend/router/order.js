const express = require("express");
const checkPaymentCompletion = require("../controllers/order/checkPaymentCompletion");
const getOrderHistoryController = require("../controllers/order/getOrderHistory");
const paymentCheckoutController = require("../controllers/order/paymentCheckout");
const placeOrderController = require("../controllers/order/placeOrder");
const setOrderStatusController = require("../controllers/order/setOrderStatus");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

 //no checkAuth middleware to allow for paymob http requests 
router.post("/completion", checkPaymentCompletion);

router.use(checkAuth());
router.post("/", placeOrderController);
router.get("/history", getOrderHistoryController);
router.post("/:id/payment", paymentCheckoutController);
router.patch("/:id/status", setOrderStatusController);

module.exports = router;
