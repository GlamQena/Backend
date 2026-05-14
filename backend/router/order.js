const express = require("express");
const checkPaymentCompletion = require("../controllers/order/checkPaymentCompletion");
const getClientOrdersController = require("../controllers/order/getClientOrders");
const paymentCheckoutController = require("../controllers/order/paymentCheckout");
const placeOrderController = require("../controllers/order/placeOrder");
const setOrderStatusController = require("../controllers/order/setOrderStatus");
const getOrderDetailsController = require("../controllers/order/getOrderDetails");
const getOrdersByOwnerStoreId = require("../controllers/order/getOrdersByOwnerStoreId");
const cancelOrderController = require("../controllers/order/cancelOrder");
const reOrderRequest = require("../controllers/order/reOrderRequest");

const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const rateOrderProductController = require("../controllers/order/rateOrderProduct");

const getAllOrders = require("../controllers/order/getAllOrders");

const router = express.Router();

//no checkAuth middleware to allow the paymob http requests
router.post("/completion", checkPaymentCompletion);
router.use(checkAuth());

router.get("/history", checkRole("client"), getClientOrdersController);
router.get(
  "/:id",
  checkRole(["client", "store_owner"]),
  getOrderDetailsController,
);
router.get("/", checkRole("store_owner"), getOrdersByOwnerStoreId);

router.post("/", checkRole("client"), placeOrderController);
router.post("/:id/payment", checkRole("client"), paymentCheckoutController);
router.post("/:id/reorder",checkRole("client"), reOrderRequest);
router.post("/:id/rating", checkRole("client"), rateOrderProductController);

router.patch("/:id/status", setOrderStatusController);
router.patch(
  "/:id/cancel",
  checkRole(["client", "admin"]),
  cancelOrderController,
);

router.get("/admin/orders", checkRole("admin"), getAllOrders);

module.exports = router;
