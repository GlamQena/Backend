const express = require("express");
const upload = require("../utils/upload.js");

const getProductById = require("../controllers/products/getProductById");
const rateProductController = require("../controllers/products/rateProduct");
const addNewProductController = require("../controllers/products/addNewProduct");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.use(checkAuth);
router.get("/:id", getProductById);
router.post("/:id/rating", rateProductController);
router.post(
  "/add-new-product",
  upload.array("images", 7),
  addNewProductController,
);

module.exports = router;
