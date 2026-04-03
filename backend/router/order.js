const express = require("express");
const checkPaymentCompletion = require("../controllers/order/checkPaymentCompletion");
const getOrderHistoryController = require("../controllers/order/getOrderHistory");
const paymentCheckoutController = require("../controllers/order/paymentCheckout");
const placeOrderController = require("../controllers/order/placeOrder");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.use(checkAuth);
router.post("/", placeOrderController);
router.get("/history", getOrderHistoryController);
router.post("/checkout", paymentCheckoutController);
router.post("/completion", checkPaymentCompletion);

module.exports = router;
