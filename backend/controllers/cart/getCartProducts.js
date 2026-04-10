const cartModel = require("../../models/cart");
const productModel = require("../../models/product");

const getCartProducts = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const { session_id } = req.body;

    // Validate either user_id or session_id is provided
    if (!user_id && !session_id) {
      return res.status(400).json({
        success: false,
        message: "Either user_id or session_id is required"
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
      cart = await mergeCartsForGet(userCart, sessionCart);
      
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
        await cart.save();
      }
    }

    // If no cart exists, return empty cart
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          products: [],
          summary: {
            total_items: 0,
            total_price: 0,
            total_stores: 0,
            is_cart_empty: true
          }
        }
      });
    }

    // Populate cart data after potential merging
    cart = await cartModel
      .findById(cart._id)
      .populate('products.owner_store_id', 'store_name store_phone store_email store_address store_description')
      .populate('products.products.prod_id', 'name price stock images description weight dimensions skinType ingredients');

    // Process cart products with real-time stock information
    let processedStores = [];
    let stockIssues = [];
    let totalItems = 0;
    let totalPrice = 0;

    // Process each store in cart
    for (const store of cart.products) {
      let storeProducts = [];
      let storeSubtotal = 0;
      let storeHasStockIssues = false;

      // Get store info
      const storeInfo = store.owner_store_id;
      
      // Process each product in store
      for (const cartProduct of store.products) {
        totalItems += cartProduct.quantity;
        
        // Get real-time product data from database
        const dbProduct = await productModel.findById(cartProduct.prod_id._id || cartProduct.prod_id);
        
        let productData = {
          product_id: cartProduct.prod_id._id || cartProduct.prod_id,
          name: cartProduct.name,
          price: cartProduct.price,
          quantity: cartProduct.quantity,
          subtotal: cartProduct.subtotal_price,
          is_available: true,
          stock_status: "in_stock",
          available_stock: null,
          stock_warning: null
        };

        // Add product image if available
        if (dbProduct && dbProduct.images && dbProduct.images.length > 0) {
          productData.image = dbProduct.images[0];
          productData.all_images = dbProduct.images;
        }

        // Check stock availability
        if (dbProduct) {
          productData.available_stock = dbProduct.stock;
          
          if (dbProduct.stock <= 0) {
            productData.is_available = false;
            productData.stock_status = "out_of_stock";
            productData.stock_warning = "Out of stock";
            stockIssues.push({
              product_id: cartProduct.prod_id._id || cartProduct.prod_id,
              product_name: cartProduct.name,
              store_name: storeInfo?.store_name || "Unknown Store",
              issue: "out_of_stock",
              message: `${cartProduct.name} is out of stock`
            });
            storeHasStockIssues = true;
          } else if (dbProduct.stock < cartProduct.quantity) {
            productData.is_available = false;
            productData.stock_status = "insufficient_stock";
            productData.stock_warning = `Only ${dbProduct.stock} available`;
            stockIssues.push({
              product_id: cartProduct.prod_id._id || cartProduct.prod_id,
              product_name: cartProduct.name,
              store_name: storeInfo?.store_name || "Unknown Store",
              issue: "insufficient_stock",
              requested: cartProduct.quantity,
              available: dbProduct.stock,
              message: `${cartProduct.name}: Only ${dbProduct.stock} available`
            });
            storeHasStockIssues = true;
          } else if (dbProduct.stock < 5) {
            productData.stock_warning = `Low stock (${dbProduct.stock} left)`;
          }
          
          // Update price if changed in database
          if (dbProduct.price !== cartProduct.price) {
            productData.price_changed = true;
            productData.old_price = cartProduct.price;
            productData.current_price = dbProduct.price;
            productData.subtotal = dbProduct.price * cartProduct.quantity;
            storeSubtotal += dbProduct.price * cartProduct.quantity;
            totalPrice += dbProduct.price * cartProduct.quantity;
          } else {
            storeSubtotal += cartProduct.subtotal_price;
            totalPrice += cartProduct.subtotal_price;
          }

          // Add additional product details
          productData.weight = dbProduct.weight;
          productData.skinType = dbProduct.skinType;
          productData.description = dbProduct.description;
          
        } else {
          // Product no longer exists
          productData.is_available = false;
          productData.stock_status = "product_not_found";
          productData.stock_warning = "Product unavailable";
          stockIssues.push({
            product_id: cartProduct.prod_id._id || cartProduct.prod_id,
            product_name: cartProduct.name,
            store_name: storeInfo?.store_name || "Unknown Store",
            issue: "product_not_found",
            message: `${cartProduct.name} is no longer available`
          });
          storeHasStockIssues = true;
        }

        storeProducts.push(productData);
      }

      // Only add store if it has products
      if (storeProducts.length > 0) {
        processedStores.push({
          store_id: storeInfo?._id || store.owner_store_id,
          store_name: storeInfo?.store_name || "Unknown Store",
          store_phone: storeInfo?.store_phone || null,
          store_email: storeInfo?.store_email || null,
          store_address: storeInfo?.store_address || null,
          products: storeProducts,
          store_subtotal: storeSubtotal,
          has_stock_issues: storeHasStockIssues,
          product_count: storeProducts.length,
          total_quantity: storeProducts.reduce((sum, p) => sum + p.quantity, 0)
        });
      }
    }

    // Prepare cart summary
    const cartSummary = {
      total_items: totalItems,
      total_price: totalPrice,
      original_total_price: cart.total_price,
      total_stores: processedStores.length,
      has_stock_issues: stockIssues.length > 0,
      stock_issues_count: stockIssues.length,
      is_cart_empty: totalItems === 0,
      was_merged: wasMerged
    };

    // Auto-update cart if prices changed (optional)
    if (cartSummary.total_price !== cart.total_price && req.query.auto_update === 'true') {
      cart.total_price = totalPrice;
      
      // Update store subtotals and product subtotals
      for (let i = 0; i < cart.products.length; i++) {
        let newStoreSubtotal = 0;
        for (let j = 0; j < cart.products[i].products.length; j++) {
          const dbProduct = await productModel.findById(cart.products[i].products[j].prod_id);
          if (dbProduct && dbProduct.price !== cart.products[i].products[j].price) {
            cart.products[i].products[j].price = dbProduct.price;
            cart.products[i].products[j].subtotal_price = dbProduct.price * cart.products[i].products[j].quantity;
          }
          newStoreSubtotal += cart.products[i].products[j].subtotal_price;
        }
        cart.products[i].store_subtotal = newStoreSubtotal;
      }
      
      await cart.save();
      cartSummary.auto_updated = true;
    }

    const responseData = {
      success: true,
      message: stockIssues.length > 0 ? "Cart retrieved with stock warnings" : "Cart retrieved successfully",
      data: {
        products: processedStores,
        summary: cartSummary,
        ...(stockIssues.length > 0 && { stock_issues: stockIssues })
      }
    };

    // Add merge info if carts were merged
    if (wasMerged) {
      responseData.message = "Carts merged successfully. " + responseData.message;
      responseData.data.merge_info = {
        merged: true,
        previous_session_cleared: true
      };
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error("Error in getCartProducts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Helper function to merge two carts for get operation
const mergeCartsForGet = async (userCart, sessionCart) => {
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

        if (userProductIndex === -1) {
          // Product doesn't exist, add it
          userCart.products[userStoreIndex].products.push(sessionProduct);
        } else {
          // Product exists, merge quantities
          const currentQuantity = userCart.products[userStoreIndex].products[userProductIndex].quantity;
          const additionalQuantity = sessionProduct.quantity;
          const totalQuantity = currentQuantity + additionalQuantity;
          
          // Fetch product to check stock limits
          const dbProduct = await productModel.findById(sessionProduct.prod_id);
          
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

module.exports = getCartProducts;