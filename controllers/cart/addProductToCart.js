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

    // Get product from database with populated owner_store_id
    const product = await productModel.findById(product_id).populate('owner_store_id');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    //trial to test the case of creatinf duplicate groups of the same product and storeOwner in the same cart

    // Ensure product has owner_store_id
    if (!product.owner_store_id) {
      return res.status(400).json({
        success: false,
        message: "Product does not have an associated store",
      });
    }

    // Log for debugging
    console.log("Product owner_store_id:", product.owner_store_id);
    console.log("Product owner_store_id type:", typeof product.owner_store_id);
    console.log("Product owner_store_id _id:", product.owner_store_id._id || product.owner_store_id);

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

    // Log existing cart stores
    console.log("Cart stores before add:", cart.products.map(s => ({
      store_id: s.owner_store_id,
      store_id_str: s.owner_store_id.toString(),
      product_count: s.products.length
    })));

    // Add product to cart with proper store identification
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
      .populate("user_id", "firstName lastName email")
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