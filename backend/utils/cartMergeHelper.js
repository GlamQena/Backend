// utils/cartMergeHelper.js
const cartModel = require("../models/cart");
const productModel = require("../models/product");

/**
 * Get the primary cart (handles merging automatically)
 */
const getPrimaryCart = async (user_id, session_id, createIfNotFound = false) => {
  let userCart = null;
  let sessionCart = null;
  
  if (user_id) userCart = await cartModel.findOne({ user_id });
  if (session_id) sessionCart = await cartModel.findOne({ session_id });
  
  let cart = null;
  let wasMerged = false;
  
  // Both carts exist - merge them
  if (userCart && sessionCart && userCart._id.toString() !== sessionCart._id.toString()) {
    cart = await mergeCarts(userCart, sessionCart);
    await cartModel.findByIdAndDelete(sessionCart._id);
    wasMerged = true;
  } 
  // Only one cart exists
  else if (userCart) {
    cart = userCart;
  } else if (sessionCart) {
    cart = sessionCart;
    if (user_id && !cart.user_id) {
      cart.user_id = user_id;
      await cart.save();
    }
  } 
  // Create new cart if needed
  else if (createIfNotFound) {
    if (user_id) cart = new cartModel({ user_id, products: [] });
    else if (session_id) cart = new cartModel({ session_id, products: [] });
    if (cart) await cart.save();
  }
  
  return { cart, wasMerged };
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
      userCart.products.push(sessionStore);
    } else {
      for (const sessionProduct of sessionStore.products) {
        const userProductIndex = userCart.products[userStoreIndex].products.findIndex(
          p => p.prod_id.toString() === sessionProduct.prod_id.toString()
        );

        if (userProductIndex === -1) {
          userCart.products[userStoreIndex].products.push(sessionProduct);
        } else {
          // Merge quantities
          userCart.products[userStoreIndex].products[userProductIndex].quantity += sessionProduct.quantity;
          userCart.products[userStoreIndex].products[userProductIndex].subtotal_price = 
            userCart.products[userStoreIndex].products[userProductIndex].price * 
            userCart.products[userStoreIndex].products[userProductIndex].quantity;
        }
      }
      
      // Recalculate store subtotal
      userCart.products[userStoreIndex].store_subtotal = userCart.products[userStoreIndex].products.reduce(
        (sum, prod) => sum + prod.subtotal_price, 0
      );
    }
  }
  
  userCart.total_price = userCart.products.reduce((sum, store) => sum + store.store_subtotal, 0);
  userCart.session_id = null;
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
      message: `Only ${product.stock - currentQuantity} more available`,
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
  const owner_store_id = product.owner_store_id;
  const prod_id = product._id;
  
  let storeIndex = cart.products.findIndex(
    store => store.owner_store_id.toString() === owner_store_id.toString()
  );
  
  let productIndex = -1;
  let currentQuantity = 0;
  
  if (storeIndex !== -1) {
    productIndex = cart.products[storeIndex].products.findIndex(
      p => p.prod_id.toString() === prod_id.toString()
    );
    if (productIndex !== -1) {
      currentQuantity = cart.products[storeIndex].products[productIndex].quantity;
    }
  }
  
  // Validate stock
  const stockCheck = await getProductWithStock(prod_id, quantity, currentQuantity);
  if (!stockCheck.valid) return stockCheck;
  
  if (storeIndex === -1) {
    // New store
    cart.products.push({
      owner_store_id,
      products: [{
        prod_id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal_price: product.price * quantity
      }],
      store_subtotal: product.price * quantity
    });
  } else if (productIndex === -1) {
    // New product in existing store
    cart.products[storeIndex].products.push({
      prod_id,
      name: product.name,
      price: product.price,
      quantity,
      subtotal_price: product.price * quantity
    });
    cart.products[storeIndex].store_subtotal += product.price * quantity;
  } else {
    // Update existing product
    cart.products[storeIndex].products[productIndex].quantity = stockCheck.totalAfterAdd;
    cart.products[storeIndex].products[productIndex].subtotal_price = 
      product.price * stockCheck.totalAfterAdd;
    cart.products[storeIndex].store_subtotal = cart.products[storeIndex].products.reduce(
      (sum, p) => sum + p.subtotal_price, 0
    );
  }
  
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

module.exports = { getPrimaryCart, addToCart, removeFromCart, getProductWithStock };