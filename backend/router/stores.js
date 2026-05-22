const express = require("express");
const checkAuth = require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const getStoresController = require("../controllers/stores/getStores");
const getStoreProducts = require("../controllers/stores/getStoreProducts");
const getStoreStatistics = require("../controllers/stores/getStoreStatistics");
const getStoreSalesChart = require("../controllers/stores/getStoreSalesChart");
const getActiveClients = require("../controllers/stores/getActiveClients");

const router = express.Router();

router.get("/me/statistics", checkAuth(), checkRole("store_owner"), getStoreStatistics);
router.get("/me/sales-chart", checkAuth(), checkRole("store_owner"), getStoreSalesChart);
router.get("/me/active-clients", checkAuth(), checkRole("store_owner"), getActiveClients);

router.use(checkAuth(true));
router.get("/", getStoresController);
router.get("/:id/products", getStoreProducts);
module.exports = router;