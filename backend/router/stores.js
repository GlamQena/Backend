const express = require("express");
const getStoresController = require("../controllers/stores/getStores");
const getStoreProducts = require("../controllers/stores/getStoreProducts");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.use(checkAuth(true));
router.get("/", getStoresController);
router.get("/:id", getStoreProducts);

module.exports = router;
