const productModel = require("../../models/product");
const cartModel = require("../../models/cart");
const { getPrimaryCart, addToCart } = require("../../utils/cartMergeHelper");

const addProductToCart = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const { session_id, product_id, quantity = 1 } = req.body;

    // Validate required fields
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!user_id && !session_id) {
      return res.status(400).json({
        success: false,
        message: "Either user_id or session_id is required",
      });
    }

    // Get product from database
    const product = await productModel.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get cart with retry logic
    let cart = null;
    let retries = 3;
    
    while (retries > 0 && !cart) {
      const result = await getPrimaryCart(user_id, session_id, true);
      cart = result.cart;
      
      if (!cart && result.error) {
        console.log(`Attempt ${4 - retries} failed:`, result.error);
        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        break;
      }
    }
    
    if (!cart) {
      return res.status(500).json({
        success: false,
        message: "Failed to create or retrieve cart",
        debug: { user_id, session_id }
      });
    }

    // Add product to cart
    const result = await addToCart(cart, product, quantity);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        ...(result.maxAddable !== undefined && { maxAddable: result.maxAddable }),
      });
    }

    // Get populated cart for response
    const populatedCart = await cartModel
      .findById(cart._id)
      .populate("user_id", "name email")
      .populate("products.owner_store_id", "store_name")
      .populate("products.products.prod_id", "name price stock images");

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: {
        cart: populatedCart,
      },
    });
  } catch (error) {
    console.error("Error in addProductToCart:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = addProductToCart;