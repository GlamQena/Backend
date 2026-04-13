const productModel = require("../../models/product");
const cartModel = require("../../models/cart")
const { getPrimaryCart, addToCart } = require("../../utils/cartMergeHelper");

const addProductToCart = async (req, res) => {
  try {
    const user_id = req.user?.id || undefined;
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

    // Get product from database (this gives us owner_store_id automatically)
    const product = await productModel.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get or create cart (handles merging automatically)
    const { cart, wasMerged } = await getPrimaryCart(user_id, session_id, true);
    
    if (!cart) {
      return res.status(500).json({
        success: false,
        message: "Failed to create or retrieve cart",
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
      message: wasMerged ? "Carts merged and product added" : "Product added to cart",
      data: {
        cart: populatedCart,
        wasMerged,
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