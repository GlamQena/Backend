const { getPrimaryCart, removeFromCart } = require("../../utils/cartMergeHelper");
const cartModel = require("../../models/cart");

const removeProductFromCart = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const product_id = req.params.id;
    const { session_id, remove_all = false } = req.body;

    // Validate required fields
    if (!user_id && !session_id) {
      return res.status(400).json({
        success: false,
        message: "Either user_id or session_id is required",
      });
    }

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Get cart - NO MERGING HERE
    const { cart } = await getPrimaryCart(user_id, session_id, false);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find which store this product belongs to
    let foundStoreId = null;
    for (const store of cart.products) {
      const productExists = store.products.some(p => p.prod_id.toString() === product_id);
      if (productExists) {
        foundStoreId = store.owner_store_id;
        break;
      }
    }

    if (!foundStoreId) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Remove product from cart
    const result = await removeFromCart(cart, product_id, foundStoreId, remove_all);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    // Get updated cart
    let updatedCart = null;
    if (cart.products.length > 0) {
      updatedCart = await cartModel
        .findById(cart._id)
        .populate("products.products.prod_id", "name price stock images");
    }

    return res.status(200).json({
      success: true,
      message: result.removedCompletely 
        ? `Product "${result.productName}" removed from cart`
        : `Quantity decreased by 1 for "${result.productName}"`,
      data: {
        cart_id: cart._id,
        removed_product: {
          product_id,
          product_name: result.productName,
          quantity_removed: result.removedQuantity,
          new_quantity_in_cart: result.newQuantity,
          removed_completely: result.removedCompletely,
        },
        current_cart: updatedCart ? {
          total_items: updatedCart.products.reduce(
            (sum, store) => sum + store.products.reduce((s, p) => s + p.quantity, 0), 0
          ),
          total_price: updatedCart.total_price,
          total_stores: updatedCart.products.length,
        } : {
          total_items: 0,
          total_price: 0,
          total_stores: 0,
          is_empty: true,
        },
      },
    });
  } catch (error) {
    console.error("Error in removeProductFromCart:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = removeProductFromCart;