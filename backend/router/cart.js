const express= require("express");
const addProductToCart = require("../controllers/cart/addProductToCart");
const getCartProducts = require("../controllers/cart/getCartProducts");
const removeProductFromCart = require("../controllers/cart/removeProductFromCart");
const ifToken = require("../middleware/ifToken");

const router= express.Router();

router.use(ifToken);
router.get("/", getCartProducts);
router.post("/product", addProductToCart);
router.delete("/product/:id", removeProductFromCart);

module.exports= router;