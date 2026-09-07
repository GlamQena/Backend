const express = require("express");
const crypto = require("crypto");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const checkAdminPermissions = require("../middleware/checkAdminPermissions");

const checkPaymentCompletion = require("../controllers/order/checkPaymentCompletion");
const getClientOrdersController = require("../controllers/order/getClientOrders");
const paymentCheckoutController = require("../controllers/order/paymentCheckout");
const placeOrderController = require("../controllers/order/placeOrder");
const setOrderStatusController = require("../controllers/order/setOrderStatus");
const getOrderDetailsController = require("../controllers/order/getOrderDetails");
const getOrdersByOwnerStoreId = require("../controllers/order/getOrdersByOwnerStoreId");
const cancelOrderController = require("../controllers/order/cancelOrder");
const reOrderRequest = require("../controllers/order/reOrderRequest");
const rateOrderProductController = require("../controllers/order/rateOrderProduct");
const getAllOrders = require("../controllers/order/getAllOrders");

const router = express.Router();

//no checkAuth middleware to allow the paymob http requests
router.post("/completion", 
  express.raw({ type: 'application/json' }), // 1. Capture raw body first
    (req, res, next) => {
        try {
            const hmac = req.query.hmac; // Paymob sends HMAC as a query param, NOT a header!
            
            // IMPORTANT: Paymob computes HMAC over 20 specific fields from `obj`
            // You must construct the exact string Paymob uses.
            const { obj } = JSON.parse(req.body.toString());
            
            const hmacHash = crypto.createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
                .update(
                    `${obj.id}${obj.order.id}${obj.amount_cents}${obj.currency}${obj.pending}${obj.success}${obj.is_3d_secure}${obj.is_auth}${obj.is_capture}${obj.is_standalone_payment}${obj.is_voided}${obj.is_refunded}${obj.is_voided}${obj.captured_amount}${obj.data?.type}${obj.data?.pan}${obj.data?.merchant_id}${obj.data?.gateway_integration_id}${obj.data?.created_at}${obj.data?.updated_at}`
                )
                .digest('hex');

            if (hmacHash !== hmac) {
                return res.status(401).send("Invalid HMAC");
            }

            // 2. Re-attach the parsed JSON body for your controller
            req.body = JSON.parse(req.body.toString());
            next();
        } catch (err) {
            console.error("Webhook processing error:", err);
            return res.status(400).send("Bad Request");
        }
    },
  checkPaymentCompletion);
router.use(checkAuth());

router.get("/history", checkRole(["client", "admin"]), getClientOrdersController);
router.get(
  "/:id",
  checkRole(["client", "store_owner", "admin"]),
  getOrderDetailsController,
);
router.get("/", checkRole("store_owner"), getOrdersByOwnerStoreId);

router.post("/", checkRole(["client", "admin"]), placeOrderController);
router.post("/:id/payment", checkRole(["client", "admin"]), paymentCheckoutController);
router.post("/:id/reorder",checkRole(["client", "admin"]), reOrderRequest);
router.post("/:id/rating", checkRole(["client", "admin"]), rateOrderProductController);

router.patch("/:id/status", setOrderStatusController);
router.patch(
  "/:id/cancel",
  checkRole(["client", "admin"]),
  cancelOrderController,
);

router.get("/admin/orders", checkRole("admin"), checkAdminPermissions(["manageOrders"]), getAllOrders);

module.exports = router;
