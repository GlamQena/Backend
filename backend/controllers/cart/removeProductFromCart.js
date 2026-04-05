const cartModel = require("../../models/cart");
const productModel = require("../../models/product");

const removeProductFromCart = async (req, res) => {
  try {
    const product_id = req.params.id;
    const { user_id, session_id, owner_store_id, remove_all } = req.body;
    

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

    if (!owner_store_id) {
      return res.status(400).json({
        success: false,
        message: "Store owner ID is required",
      });
    }

    // Find the cart
    let cart = await cartModel.findOne({
      $or: [{ user_id: user_id }, { session_id: session_id }],
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find the store in cart
    let storeIndex = cart.products.findIndex(
      (store) => store.owner_store_id.toString() === owner_store_id,
    );

    if (storeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Store not found in cart",
      });
    }

    // Find the product in the store
    const productIndex = cart.products[storeIndex].products.findIndex(
      (p) => p.prod_id.toString() === product_id,
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    let removedProduct = null;
    let removedQuantity = 0;

    // Check if we should remove one quantity or the entire product
    if (remove_all === true || remove_all === "true") {
      // Remove entire product
      removedProduct = cart.products[storeIndex].products[productIndex];
      removedQuantity = removedProduct.quantity;

      // Remove the product from the array
      cart.products[storeIndex].products.splice(productIndex, 1);

      // If no products left in this store, remove the store
      if (cart.products[storeIndex].products.length === 0) {
        cart.products.splice(storeIndex, 1);
      } else {
        // Recalculate store subtotal
        cart.products[storeIndex].store_subtotal = cart.products[
          storeIndex
        ].products.reduce((sum, prod) => sum + prod.subtotal_price, 0);
      }
    } else {
      // Remove only one quantity
      const currentProduct = cart.products[storeIndex].products[productIndex];

      if (currentProduct.quantity > 1) {
        // Decrease quantity by 1
        currentProduct.quantity -= 1;
        currentProduct.subtotal_price =
          currentProduct.price * currentProduct.quantity;
        removedQuantity = 1;
        removedProduct = currentProduct;

        // Update store subtotal
        cart.products[storeIndex].store_subtotal = cart.products[
          storeIndex
        ].products.reduce((sum, prod) => sum + prod.subtotal_price, 0);
      } else {
        // If quantity is 1, remove the product entirely
        removedProduct = currentProduct;
        removedQuantity = currentProduct.quantity;
        cart.products[storeIndex].products.splice(productIndex, 1);

        // If no products left in this store, remove the store
        if (cart.products[storeIndex].products.length === 0) {
          cart.products.splice(storeIndex, 1);
        } else {
          // Recalculate store subtotal
          cart.products[storeIndex].store_subtotal = cart.products[
            storeIndex
          ].products.reduce((sum, prod) => sum + prod.subtotal_price, 0);
        }
      }
    }

    // Recalculate total cart price
    cart.total_price = cart.products.reduce(
      (sum, store) => sum + store.store_subtotal,
      0,
    );

    // Save the updated cart
    await cart.save();

    // Get updated cart with populated data for response
    let updatedCart = null;
    if (cart.products.length > 0) {
      updatedCart = await cartModel
        .findById(cart._id)
        .populate(
          "products.owner_store_id",
          "store_name store_phone store_email",
        )
        .populate("products.products.prod_id", "name price stock images");
    }

    // Prepare response message
    let message = "";
    if (remove_all === true || remove_all === "true") {
      message = `Product "${removedProduct?.name || "Product"}" removed completely from cart`;
    } else {
      if (
        removedQuantity === 1 &&
        removedProduct &&
        removedProduct.quantity === 0
      ) {
        message = `Product "${removedProduct?.name || "Product"}" removed from cart`;
      } else {
        message = `Quantity decreased by 1 for product "${removedProduct?.name || "Product"}"`;
      }
    }

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        cart_id: cart._id,
        removed_product: {
          product_id: product_id,
          product_name: removedProduct?.name || "Unknown Product",
          quantity_removed: removedQuantity,
          removed_completely:
            remove_all === true ||
            remove_all === "true" ||
            removedProduct?.quantity === 0,
        },
        current_cart: updatedCart
          ? {
              products: updatedCart.products,
              total_items: updatedCart.products.reduce(
                (sum, store) =>
                  sum + store.products.reduce((s, p) => s + p.quantity, 0),
                0,
              ),
              total_price: updatedCart.total_price,
              total_stores: updatedCart.products.length,
            }
          : {
              products: [],
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
