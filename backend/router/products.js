const express = require("express");
const getProductById = require("../controllers/products/getProductById");
const rateProductController = require("../controllers/products/rateProduct");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.use(checkAuth);
router.get("/:id", getProductById);
router.post("/:id/rating", rateProductController);

module.exports = router;
