const express = require("express");
const {upload, uploadToCloudinary} = require("../utils/upload.js");

const getProductById = require("../controllers/products/getProductById");
const addNewProductController = require("../controllers/products/addNewProduct");
const checkAuth = require("../middleware/checkAuth");
const deleteProductController = require("../controllers/products/deleteProduct.js");
const checkRole = require("../middleware/checkRole.js");
const getSpecialProducts = require("../controllers/products/getSpecialProducts.js");

const editProductById = require("../controllers/products/editProductById");

const router = express.Router();

router.use(checkAuth(true));
router.get("/special", getSpecialProducts);
router.get("/:id", getProductById);

router.use(checkAuth());

router.use(checkRole(["store_owner"]));
router.post("/",
     upload.array('images', 7), // Accept up to 7 images
     uploadToCloudinary, // Process and upload to Cloudinary with duplicate check
     addNewProductController
    );

router.delete("/:id", deleteProductController);

router.put("/:id", 
    upload.array('images', 7),
    uploadToCloudinary,
    editProductById
);

module.exports = router;
