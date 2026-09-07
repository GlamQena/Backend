const cartModel = require("../models/cart");
const productModel = require("../models/product");
const mongoose = require("mongoose");

/**
 * Just returns the appropriate cart based on user_id OR session_id
 */
const getPrimaryCart = async (user_id, session_id, createIfNotFound = false) => {
  let cart = null;
  
  try {
    let userIdObj = null;
    if (user_id) {
      try {
        userIdObj = typeof user_id === 'string' 
          ? new mongoose.Types.ObjectId(user_id) 
          : user_id;
      } catch (err) {
        console.error("Invalid user_id format:", user_id);
      }
    }

    // Priority: user cart > session cart
    if (userIdObj) {
      cart = await cartModel.findOne({ user_id: userIdObj });
      console.log(`fetched cart for user_id ${userIdObj}=>`, cart);
    }
    
    if (!cart && session_id) {
      cart = await cartModel.findOne({ session_id });
      console.log("fetched cart for session_id =>", cart);
    }
    
    // Create new cart if needed
    if (!cart && createIfNotFound) {
      let newCart = null;
      
      if (user_id) {
        newCart = new cartModel({ 
          user_id: user_id, 
          session_id: null,
          products: [],
          total_price: 0 
        });
      } else if (session_id) {
        newCart = new cartModel({ 
          user_id: null,
          session_id: session_id, 
          products: [],
          total_price: 0 
        });
      } else {
        throw new Error("Either user_id or session_id is required");
      }
      
      // Save with error handling for duplicate keys
      try {
        cart = await newCart.save();
        console.log(`Created new cart for ${user_id ? 'user: ' + user_id : 'session: ' + session_id}`);
      } catch (saveError) {
        // Handle duplicate key error (race condition)
        if (saveError.code === 11000) {
          console.log("Duplicate key, fetching existing cart...");

           // Add a small delay to ensure the other operation completes
          // await new Promise(resolve => setTimeout(resolve, 50));

          // Fetch the existing cart
          if (user_id) {
            cart = await cartModel.findOne({ user_id });
          } else if (session_id) {
            cart = await cartModel.findOne({ session_id });
          }
          
          if (!cart) {
            throw new Error("Failed to retrieve cart after duplicate error");
          }
        } else {
          throw saveError;
        }
      }
    }
    
    return { cart, wasMerged: false };
    
  } catch (error) {
    console.error("Error in getPrimaryCart:", error);
    return { cart: null, wasMerged: false, error: error.message };
  }
};

/**
 * Merge guest cart with user cart - ONLY CALL THIS DURING LOGIN/REGISTER
 */
const mergeGuestCartWithUserCart = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return { success: false, message: "Both userId and sessionId are required" };
  }

  try {
    // Find both carts
    const userCart = await cartModel.findOne({ user_id: userId });
    const sessionCart = await cartModel.findOne({ session_id: sessionId });

    // If no session cart exists, nothing to merge
    if (!sessionCart) {
      return { success: true, merged: false, message: "No guest cart to merge" };
    }

    // If user has no cart, just assign the session cart to the user
    if (!userCart) {
      sessionCart.user_id = userId;
      sessionCart.session_id = null;
      await sessionCart.save();
      return { 
        success: true, 
        merged: true, 
        message: "Guest cart assigned to user",
        cart: sessionCart
      };
    }

    // Both carts exist - merge them
    const mergedCart = await mergeCarts(userCart, sessionCart);
    await cartModel.findByIdAndDelete(sessionCart._id);
    
    return { 
      success: true, 
      merged: true, 
      message: "Carts merged successfully",
      cart: mergedCart
    };
  } catch (error) {
    console.error("Error merging carts:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Merge session cart into user cart
 */
const mergeCarts = async (userCart, sessionCart) => {
  for (const sessionStore of sessionCart.products) {
    const userStoreIndex = userCart.products.findIndex(
      store => store.owner_store_id.toString() === sessionStore.owner_store_id.toString()
    );

    if (userStoreIndex === -1) {
      // Add entire store from session cart
      userCart.products.push(sessionStore);
    } else {
      // Merge products within existing store
      for (const sessionProduct of sessionStore.products) {
        const userProductIndex = userCart.products[userStoreIndex].products.findIndex(
          p => p.prod_id.toString() === sessionProduct.prod_id.toString()
        );

        if (userProductIndex === -1) {
          // Add new product to existing store
          userCart.products[userStoreIndex].products.push(sessionProduct);
        } else {
          // Merge quantities (but don't exceed stock limits)
          const existingProduct = userCart.products[userStoreIndex].products[userProductIndex];
          const newQuantity = existingProduct.quantity + sessionProduct.quantity;
          
          // Check stock limit (max 99 per product)
          existingProduct.quantity = Math.min(newQuantity, 99);
          existingProduct.subtotal_price = existingProduct.price * existingProduct.quantity;
        }
      }
      
      // Recalculate store subtotal
      userCart.products[userStoreIndex].store_subtotal = userCart.products[userStoreIndex].products.reduce(
        (sum, prod) => sum + prod.subtotal_price, 0
      );
    }
  }
  
  // Recalculate total price
  userCart.total_price = userCart.products.reduce((sum, store) => sum + store.store_subtotal, 0);
  userCart.session_id = null; // Clear session_id from user cart
  await userCart.save();
  
  return userCart;
};

/**
 * Get product with stock validation
 */
const getProductWithStock = async (productId, requestedQuantity = 1, currentQuantity = 0) => {
  const product = await productModel.findById(productId);
  
  if (!product) {
    return { valid: false, message: "Product not found" };
  }
  
  if (product.stock <= 0) {
    return { valid: false, message: "Product is out of stock" };
  }
  
  const totalAfterAdd = currentQuantity + requestedQuantity;
  
  if (totalAfterAdd > product.stock) {
    return { 
      valid: false, 
      message: `Only ${product.stock - currentQuantity} items more available to add`,
      maxAddable: product.stock - currentQuantity
    };
  }
  
  if (totalAfterAdd > 99) {
    return { 
      valid: false, 
      message: "Maximum 99 items per product",
      maxAddable: 99 - currentQuantity
    };
  }
  
  return { valid: true, product, totalAfterAdd };
};

/**
 * Add product to cart
 */
const addToCart = async (cart, product, quantity) => {
  // CRITICAL FIX: Get the store ID properly
  // If owner_store_id is populated, it might be an object with _id
  let ownerStoreId;
  if (product.owner_store_id && typeof product.owner_store_id === 'object') {
    // If it's populated with _id
    ownerStoreId = product.owner_store_id._id || product.owner_store_id.id || product.owner_store_id;
  } else {
    // If it's just the ID string
    ownerStoreId = product.owner_store_id;
  }
  
  const prod_id = product._id;
  
  // Convert both to strings for reliable comparison
  const ownerStoreIdStr = ownerStoreId.toString();
  const prodIdStr = prod_id.toString();
  
  console.log(`Adding product ${prodIdStr} to store ${ownerStoreIdStr}`);
  
  let storeIndex = -1;
  let productIndex = -1;
  let currentQuantity = 0;
  
  // Find store - use string comparison for reliability
  for (let i = 0; i < cart.products.length; i++) {
    const store = cart.products[i];
    const storeId = store.owner_store_id._id || store.owner_store_id;
    if (storeId.toString() === ownerStoreIdStr) {
      storeIndex = i;
      break;
    }
  }
  
  if (storeIndex !== -1) {
    // Find product within the store
    const store = cart.products[storeIndex];
    for (let j = 0; j < store.products.length; j++) {
      const prod = store.products[j];
      const prodId = prod.prod_id._id || prod.prod_id;
      if (prodId.toString() === prodIdStr) {
        productIndex = j;
        currentQuantity = prod.quantity;
        break;
      }
    }
  }
  
  console.log(`Store index: ${storeIndex}, Product index: ${productIndex}, Current quantity: ${currentQuantity}`);
  
  // Validate stock
  const stockCheck = await getProductWithStock(prod_id, quantity, currentQuantity);
  if (!stockCheck.valid) return stockCheck;
  
  // Get product price
  const productPrice = product.price || 0;
  
  if (storeIndex === -1) {
    // New store - create store entry
    const newStore = {
      owner_store_id: ownerStoreId,
      products: [{
        prod_id: prod_id,
        name: product.name,
        price: productPrice,
        quantity: quantity,
        subtotal_price: productPrice * quantity
      }],
      store_subtotal: productPrice * quantity
    };
    cart.products.push(newStore);
    console.log(`Created new store entry for store ${ownerStoreIdStr}`);
    
  } else if (productIndex === -1) {
    // New product in existing store
    const newProduct = {
      prod_id: prod_id,
      name: product.name,
      price: productPrice,
      quantity: quantity,
      subtotal_price: productPrice * quantity
    };
    cart.products[storeIndex].products.push(newProduct);
    
    // Recalculate store subtotal
    cart.products[storeIndex].store_subtotal = cart.products[storeIndex].products.reduce(
      (sum, p) => sum + p.subtotal_price, 0
    );
    console.log(`Added new product to existing store ${ownerStoreIdStr}`);
    
  } else {
    // Update existing product
    const newQuantity = stockCheck.totalAfterAdd;
    cart.products[storeIndex].products[productIndex].quantity = newQuantity;
    cart.products[storeIndex].products[productIndex].subtotal_price = 
      productPrice * newQuantity;
    
    // Recalculate store subtotal
    cart.products[storeIndex].store_subtotal = cart.products[storeIndex].products.reduce(
      (sum, p) => sum + p.subtotal_price, 0
    );
    console.log(`Updated existing product quantity to ${newQuantity}`);
  }
  
  // Recalculate total price
  cart.total_price = cart.products.reduce((sum, store) => sum + store.store_subtotal, 0);
  await cart.save();
  
  return { valid: true, totalAfterAdd: stockCheck.totalAfterAdd, product };
};

/**
 * Remove product from cart
 */
const removeFromCart = async (cart, productId, owner_store_id, removeAll = false) => {
  const storeIndex = cart.products.findIndex(
    store => store.owner_store_id.toString() === owner_store_id.toString()
  );
  
  if (storeIndex === -1) return { success: false, message: "Store not found" };
  
  const productIndex = cart.products[storeIndex].products.findIndex(
    p => p.prod_id.toString() === productId.toString()
  );
  
  if (productIndex === -1) return { success: false, message: "Product not found" };
  
  const product = cart.products[storeIndex].products[productIndex];
  let removedQuantity = 0;
  let newQuantity = 0;
  
  if (removeAll || product.quantity === 1) {
    removedQuantity = product.quantity;
    newQuantity = 0;
    cart.products[storeIndex].products.splice(productIndex, 1);
    
    if (cart.products[storeIndex].products.length === 0) {
      cart.products.splice(storeIndex, 1);
    } else {
      cart.products[storeIndex].store_subtotal = cart.products[storeIndex].products.reduce(
        (sum, p) => sum + p.subtotal_price, 0
      );
    }
  } else {
    removedQuantity = 1;
    newQuantity = product.quantity - 1;
    product.quantity = newQuantity;
    product.subtotal_price = product.price * newQuantity;
    cart.products[storeIndex].store_subtotal = cart.products[storeIndex].products.reduce(
      (sum, p) => sum + p.subtotal_price, 0
    );
  }
  
  cart.total_price = cart.products.reduce((sum, store) => sum + store.store_subtotal, 0);
  await cart.save();
  
  return { 
    success: true, 
    removedQuantity, 
    newQuantity,
    productName: product.name,
    removedCompletely: newQuantity === 0
  };
};

module.exports = { 
  getPrimaryCart, 
  addToCart, 
  removeFromCart, 
  getProductWithStock,
  mergeGuestCartWithUserCart // Only for login/register
};