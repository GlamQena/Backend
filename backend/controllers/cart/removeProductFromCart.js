const cartModel = require("../../models/cart");
const productModel = require("../../models/product");

const removeProductFromCart = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const product_id = req.params.id;
    const { session_id, owner_store_id, remove_all } = req.body;

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

    // Find carts separately for merging
    let userCart = null;
    let sessionCart = null;
    
    if (user_id) {
      userCart = await cartModel.findOne({ user_id: user_id });
    }
    
    if (session_id) {
      sessionCart = await cartModel.findOne({ session_id: session_id });
    }

    let cart = null;
    let wasMerged = false;

    // Handle merging logic when both carts exist
    if (userCart && sessionCart && userCart._id.toString() !== sessionCart._id.toString()) {
      // Merge session cart into user cart
      cart = await mergeCartsForRemove(userCart, sessionCart);
      
      // Delete the session cart after merging
      await cartModel.findByIdAndDelete(sessionCart._id);
      wasMerged = true;
      
    } else if (userCart) {
      // Only user cart exists
      cart = userCart;
    } else if (sessionCart) {
      // Only session cart exists
      cart = sessionCart;
      
      // If user is logged in, associate the session cart with the user
      if (user_id && !cart.user_id) {
        cart.user_id = user_id;
      }
    } else {
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

    // Fetch the actual product from database to check stock
    const dbProduct = await productModel.findOne({
      _id: product_id,
      owner_store_id: owner_store_id,
    });

    if (!dbProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found in database",
      });
    }

    let removedProduct = null;
    let removedQuantity = 0;
    let newQuantityInCart = 0;

    // Check if we should remove one quantity or the entire product
    if (remove_all === true || remove_all === "true") {
      // Remove entire product
      removedProduct = cart.products[storeIndex].products[productIndex];
      removedQuantity = removedProduct.quantity;
      newQuantityInCart = 0;

      // No stock validation needed when removing completely
      
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
        newQuantityInCart = currentProduct.quantity - 1;
        
        // Validate that the new quantity doesn't exceed stock (though decreasing shouldn't be an issue)
        if (newQuantityInCart > dbProduct.stock) {
          return res.status(400).json({
            success: false,
            message: `Cannot decrease quantity. Current stock is ${dbProduct.stock} units. You have ${currentProduct.quantity} in cart.`,
            currentInCart: currentProduct.quantity,
            availableStock: dbProduct.stock,
            suggestedAction: "Please remove items instead of decreasing",
          });
        }
        
        currentProduct.quantity = newQuantityInCart;
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
        newQuantityInCart = 0;
        
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
        newQuantityInCart === 0
      ) {
        message = `Product "${removedProduct?.name || "Product"}" removed from cart`;
      } else {
        message = `Quantity decreased by 1 for product "${removedProduct?.name || "Product"}"`;
      }
    }

    const responseData = {
      success: true,
      message: message,
      data: {
        cart_id: cart._id,
        was_merged: wasMerged,
        removed_product: {
          product_id: product_id,
          product_name: removedProduct?.name || "Unknown Product",
          quantity_removed: removedQuantity,
          new_quantity_in_cart: newQuantityInCart,
          removed_completely:
            remove_all === true ||
            remove_all === "true" ||
            newQuantityInCart === 0,
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
    };

    // Add stock information if product still exists in cart
    if (newQuantityInCart > 0 && dbProduct) {
      responseData.data.stock_info = {
        product_name: dbProduct.name,
        current_stock: dbProduct.stock,
        in_cart: newQuantityInCart,
        remaining_stock: dbProduct.stock - newQuantityInCart,
      };
    }

    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error("Error in removeProductFromCart:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to merge two carts for remove operation
const mergeCartsForRemove = async (userCart, sessionCart) => {
  // Merge products from session cart into user cart
  for (const sessionStore of sessionCart.products) {
    // Find if the store already exists in user cart
    const userStoreIndex = userCart.products.findIndex(
      (store) => store.owner_store_id.toString() === sessionStore.owner_store_id.toString()
    );

    if (userStoreIndex === -1) {
      // Store doesn't exist in user cart, add the entire store
      userCart.products.push(sessionStore);
    } else {
      // Store exists, merge products
      for (const sessionProduct of sessionStore.products) {
        const userProductIndex = userCart.products[userStoreIndex].products.findIndex(
          (p) => p.prod_id.toString() === sessionProduct.prod_id.toString()
        );

        // Fetch product to check stock before merging
        const dbProduct = await productModel.findOne({
          _id: sessionProduct.prod_id,
          owner_store_id: sessionStore.owner_store_id,
        });

        if (userProductIndex === -1) {
          // Product doesn't exist, add it
          userCart.products[userStoreIndex].products.push(sessionProduct);
        } else {
          // Product exists, merge quantities but respect stock limits
          const currentQuantity = userCart.products[userStoreIndex].products[userProductIndex].quantity;
          const additionalQuantity = sessionProduct.quantity;
          const totalQuantity = currentQuantity + additionalQuantity;
          
          // Check if total quantity exceeds stock
          if (dbProduct && totalQuantity > dbProduct.stock) {
            // If exceeds stock, cap at maximum available stock
            const maxAddable = dbProduct.stock - currentQuantity;
            if (maxAddable > 0) {
              userCart.products[userStoreIndex].products[userProductIndex].quantity = dbProduct.stock;
              userCart.products[userStoreIndex].products[userProductIndex].subtotal_price = 
                userCart.products[userStoreIndex].products[userProductIndex].price * dbProduct.stock;
            }
            // Log warning (optional)
            console.warn(`Stock limit reached for product ${sessionProduct.prod_id}. Capped at ${dbProduct.stock}`);
          } else {
            // Normal merge
            userCart.products[userStoreIndex].products[userProductIndex].quantity = totalQuantity;
            userCart.products[userStoreIndex].products[userProductIndex].subtotal_price = 
              userCart.products[userStoreIndex].products[userProductIndex].price * totalQuantity;
          }
        }
      }
      
      // Recalculate store subtotal after merging
      userCart.products[userStoreIndex].store_subtotal = userCart.products[userStoreIndex].products.reduce(
        (sum, prod) => sum + prod.subtotal_price, 0
      );
    }
  }
  
  // Recalculate total cart price
  userCart.total_price = userCart.products.reduce(
    (sum, store) => sum + store.store_subtotal, 0
  );
  
  // Ensure user_id is set and session_id is cleared
  userCart.user_id = userCart.user_id;
  userCart.session_id = null;
  
  // Save the merged cart
  await userCart.save();
  
  return userCart;
};

module.exports = removeProductFromCart;