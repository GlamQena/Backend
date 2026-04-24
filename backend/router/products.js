const express = require("express");
const upload = require("../utils/upload.js");

const getProductById = require("../controllers/products/getProductById");
const rateProductController = require("../controllers/products/rateProduct");
const addNewProductController = require("../controllers/products/addNewProduct");
const checkAuth = require("../middleware/checkAuth");
const deleteProductController = require("../controllers/products/deleteProduct.js");
const checkRole = require("../middleware/checkRole.js");
const getSpecialProducts = require("../controllers/products/getSpecialProducts.js");

const router = express.Router();

router.use(checkAuth(true));
router.get("/special", getSpecialProducts);
router.get("/:id", getProductById);

router.use(checkAuth());

// router.use(checkRole("store_owner"));
router.post("/", upload.array("images", 7), addNewProductController,);
router.delete("/:id", deleteProductController);

// router.use(checkRole("client"));
router.post("/:id/rating", rateProductController);

module.exports = router;
