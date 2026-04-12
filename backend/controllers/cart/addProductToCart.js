const cartModel = require("../../models/cart");
const productModel = require("../../models/product");

const addProductToCart = async (req, res) => {
  try {
    const user_id = req.user?.id || undefined; 
    const { session_id, product } = req.body;

    // Validate required fields
    if (!product || !product.prod_id || !product.owner_store_id) {
      return res.status(400).json({
        success: false,
        message: "Product details with prod_id and owner_store_id are required",
      });
    }

    // Validate either user_id or session_id is provided
    if (!user_id && !session_id) {
      return res.status(400).json({
        success: false,
        message: "Either user_id or session_id is required",
      });
    }

    // Fetch the actual product from database to check stock and get current info
    const dbProduct = await productModel.findOne({
      _id: product.prod_id,
      owner_store_id: product.owner_store_id,
    });

    if (!dbProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or doesn't belong to the specified store",
      });
    }

    // Check if product has sufficient stock
    if (dbProduct.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    const requestedQuantity = product.quantity || 1;

    // Check against actual stock
    if (requestedQuantity > dbProduct.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${dbProduct.stock} units available`,
        availableStock: dbProduct.stock,
      });
    }

    // Find existing carts
    let userCart = null;
    let sessionCart = null;
    
    if (user_id) {
      userCart = await cartModel.findOne({ user_id: user_id });
    }
    
    if (session_id) {
      sessionCart = await cartModel.findOne({ session_id: session_id });
    }

    let cart = null;

    // Handle merging logic when both carts exist
    if (userCart && sessionCart && userCart._id.toString() !== sessionCart._id.toString()) {
      // Merge session cart into user cart
      cart = await mergeCarts(userCart, sessionCart);
      
      // Delete the session cart after merging
      await cartModel.findByIdAndDelete(sessionCart._id);
      
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
      // No cart exists, create new one
      if(user_id)
        cart = new cartModel({
          user_id,
          products: [],
        });

      else if(session_id)
        cart = new cartModel({
          session_id,
          products: [],
        });
    }

    // Find if store already exists in cart
    let storeIndex = cart.products.findIndex(
      (store) => store.owner_store_id.toString() === product.owner_store_id,
    );

    let currentQuantityInCart = 0;
    let productIndex = -1;

    // Calculate current quantity in cart if product exists
    if (storeIndex !== -1) {
      productIndex = cart.products[storeIndex].products.findIndex(
        (p) => p.prod_id.toString() === product.prod_id,
      );

      if (productIndex !== -1) {
        currentQuantityInCart =
          cart.products[storeIndex].products[productIndex].quantity;
      }
    }

    // Calculate total quantity after addition
    const totalQuantityAfterAdd = currentQuantityInCart + requestedQuantity;

    // Check against stock (including what's already in cart)
    if (totalQuantityAfterAdd > dbProduct.stock) {
      return res.status(400).json({
        success: false,
        message: `Cannot add ${requestedQuantity} items. You already have ${currentQuantityInCart} in cart. Only ${dbProduct.stock - currentQuantityInCart} more available.`,
        currentInCart: currentQuantityInCart,
        availableStock: dbProduct.stock,
        requestedQuantity: requestedQuantity,
        maxAddable: dbProduct.stock - currentQuantityInCart,
      });
    }

    // Check cart quantity limit (99 max per cart item)
    if (totalQuantityAfterAdd > 99) {
      return res.status(400).json({
        success: false,
        message: "Maximum quantity per product in cart is 99",
        maxLimit: 99,
        currentInCart: currentQuantityInCart,
        requestedQuantity: requestedQuantity,
      });
    }

    if (storeIndex === -1) {
      // Add new store with the product
      cart.products.push({
        owner_store_id: product.owner_store_id,
        products: [
          {
            prod_id: dbProduct._id,
            name: dbProduct.name,
            price: dbProduct.price,
            quantity: requestedQuantity,
            subtotal_price: dbProduct.price * requestedQuantity,
          },
        ],
        store_subtotal: dbProduct.price * requestedQuantity,
      });
    } else {
      // Store exists
      if (productIndex === -1) {
        // Add new product to existing store
        cart.products[storeIndex].products.push({
          prod_id: dbProduct._id,
          name: dbProduct.name,
          price: dbProduct.price,
          quantity: requestedQuantity,
          subtotal_price: dbProduct.price * requestedQuantity,
        });
      } else {
        // Update existing product quantity
        cart.products[storeIndex].products[productIndex].quantity =
          totalQuantityAfterAdd;
        cart.products[storeIndex].products[productIndex].subtotal_price =
          dbProduct.price * totalQuantityAfterAdd;
      }

      // Recalculate store subtotal
      cart.products[storeIndex].store_subtotal = cart.products[
        storeIndex
      ].products.reduce((sum, prod) => sum + prod.subtotal_price, 0);
    }

    // Recalculate total cart price
    cart.total_price = cart.products.reduce(
      (sum, store) => sum + store.store_subtotal,
      0,
    );

    // Save the cart
    await cart.save();

    // Populate references for response
    const populatedCart = await cartModel
      .findById(cart._id)
      .populate("user_id", "name email")
      .populate("products.owner_store_id", "store_name")
      .populate("products.products.prod_id", "name price stock images");

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: {
        cart: populatedCart,
        productStockInfo: {
          productName: dbProduct.name,
          totalStock: dbProduct.stock,
          inCart: totalQuantityAfterAdd,
          remainingStock: dbProduct.stock - totalQuantityAfterAdd,
        },
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

// Helper function to merge two carts
const mergeCarts = async (userCart, sessionCart) => {
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
          userCart.products[userStoreIndex].products[userProductIndex].quantity += sessionProduct.quantity;
          userCart.products[userStoreIndex].products[userProductIndex].subtotal_price = 
            userCart.products[userStoreIndex].products[userProductIndex].price * 
            userCart.products[userStoreIndex].products[userProductIndex].quantity;
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

module.exports = addProductToCart;