const cartModel = require("../../models/cart");
const productModel = require("../../models/product");

const addProductToCart = async (req, res) => {
  try {
    const { user_id, session_id, product } = req.body;
    
    // Validate required fields
    if (!product || !product.prod_id || !product.owner_store_id) {
      return res.status(400).json({
        success: false,
        message: "Product details with prod_id and owner_store_id are required"
      });
    }

    // Validate either user_id or session_id is provided
    if (!user_id && !session_id) {
      return res.status(400).json({
        success: false,
        message: "Either user_id or session_id is required"
      });
    }

    // Fetch the actual product from database to check stock and get current info
    const dbProduct = await productModel.findOne({
      _id: product.prod_id,
      owner_store_id: product.owner_store_id
    });

    if (!dbProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or doesn't belong to the specified store"
      });
    }

    // Check if product has sufficient stock
    if (dbProduct.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock"
      });
    }

    const requestedQuantity = product.quantity || 1;

    // Check against actual stock
    if (requestedQuantity > dbProduct.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${dbProduct.stock} units available`,
        availableStock: dbProduct.stock
      });
    }

    // Find existing cart
    let cart = await cartModel.findOne({
      $or: [
        { user_id: user_id },
        { session_id: session_id }
      ]
    });

    // If cart doesn't exist, create new one
    if (!cart) {
      cart = new cartModel({
        user_id: user_id || null,
        session_id: session_id || null,
        products: []
      });
    }

    // Find if store already exists in cart
    let storeIndex = cart.products.findIndex(
      store => store.owner_store_id.toString() === product.owner_store_id
    );

    let currentQuantityInCart = 0;
    let productIndex = -1;

    // Calculate current quantity in cart if product exists
    if (storeIndex !== -1) {
      productIndex = cart.products[storeIndex].products.findIndex(
        p => p.prod_id.toString() === product.prod_id
      );
      
      if (productIndex !== -1) {
        currentQuantityInCart = cart.products[storeIndex].products[productIndex].quantity;
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
        maxAddable: dbProduct.stock - currentQuantityInCart
      });
    }

    // Check cart quantity limit (99 max per cart item)
    if (totalQuantityAfterAdd > 99) {
      return res.status(400).json({
        success: false,
        message: "Maximum quantity per product in cart is 99",
        maxLimit: 99,
        currentInCart: currentQuantityInCart,
        requestedQuantity: requestedQuantity
      });
    }

    if (storeIndex === -1) {
      // Add new store with the product
      cart.products.push({
        owner_store_id: product.owner_store_id,
        products: [{
          prod_id: dbProduct._id,
          name: dbProduct.name,
          price: dbProduct.price,
          quantity: requestedQuantity,
          subtotal_price: dbProduct.price * requestedQuantity
        }],
        store_subtotal: dbProduct.price * requestedQuantity
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
          subtotal_price: dbProduct.price * requestedQuantity
        });
      } else {
        // Update existing product quantity
        cart.products[storeIndex].products[productIndex].quantity = totalQuantityAfterAdd;
        cart.products[storeIndex].products[productIndex].subtotal_price = 
          dbProduct.price * totalQuantityAfterAdd;
      }

      // Recalculate store subtotal
      cart.products[storeIndex].store_subtotal = cart.products[storeIndex].products.reduce(
        (sum, prod) => sum + prod.subtotal_price, 0
      );
    }

    // Recalculate total cart price
    cart.total_price = cart.products.reduce(
      (sum, store) => sum + store.store_subtotal, 0
    );

    // Save the cart
    await cart.save();

    // Populate references for response
    const populatedCart = await cartModel.findById(cart._id)
      .populate('user_id', 'name email')
      .populate('products.owner_store_id', 'store_name')
      .populate('products.products.prod_id', 'name price stock images');

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: {
        cart: populatedCart,
        productStockInfo: {
          productName: dbProduct.name,
          totalStock: dbProduct.stock,
          inCart: totalQuantityAfterAdd,
          remainingStock: dbProduct.stock - totalQuantityAfterAdd
        }
      }
    });

  } catch (error) {
    console.error("Error in addProductToCart:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = addProductToCart;