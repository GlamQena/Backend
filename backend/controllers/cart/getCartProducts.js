const cartModel = require("../../models/cart");
const productModel = require("../../models/product");
const { getPrimaryCart } = require("../../utils/cartMergeHelper");

const getCartProducts = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const { session_id } = req.query;

    // Validate either user_id or session_id is provided
    if (!user_id && !session_id) {
      return res.status(400).json({
        success: false,
        message: "Either user_id or session_id is required"
      });
    }

    // Get the primary cart (handles merging automatically)
    const { cart, wasMerged } = await getPrimaryCart(user_id, session_id, false);

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

    // Populate cart data with only needed fields
    const populatedCart = await cartModel
      .findById(cart._id)
      .populate('products.owner_store_id', 'store_name')
      .populate('products.products.prod_id', 'owner_store_id name price stock images description');

    // Process cart products
    let processedStores = [];
    let stockIssues = [];
    let totalItems = 0;
    let totalPrice = 0;
    let needsUpdate = false;

    // Process each store in cart
    for (const store of populatedCart.products) {
      let storeProducts = [];
      let storeSubtotal = 0;
      let storeHasStockIssues = false;

      // Get store info
      const storeInfo = store.owner_store_id;
      
      // Process each product in store
      for (const cartProduct of store.products) {
        totalItems += cartProduct.quantity;
        
        // Get product data (already populated)
        const productData_from_db = cartProduct.prod_id;
        
        let productData = {
          product_id: productData_from_db._id,
          name: productData_from_db.name,
          price: productData_from_db.price,
          quantity: cartProduct.quantity,
          subtotal: cartProduct.subtotal_price,
          image: productData_from_db.images?.[0] || null,
          description: productData_from_db.description,
          stock: productData_from_db.stock,
          is_available: true,
          stock_warning: null
        };

        // Check stock availability
        if (productData_from_db.stock <= 0) {
          productData.is_available = false;
          productData.stock_warning = "Out of stock";
          stockIssues.push({
            product_id: productData_from_db._id,
            product_name: productData_from_db.name,
            store_name: storeInfo?.store_name || "Unknown Store",
            issue: "out_of_stock",
            message: `${productData_from_db.name} is out of stock`
          });
          storeHasStockIssues = true;
        } else if (productData_from_db.stock < cartProduct.quantity) {
          productData.is_available = false;
          productData.stock_warning = `Only ${productData_from_db.stock} available`;
          stockIssues.push({
            product_id: productData_from_db._id,
            product_name: productData_from_db.name,
            store_name: storeInfo?.store_name || "Unknown Store",
            issue: "insufficient_stock",
            requested: cartProduct.quantity,
            available: productData_from_db.stock,
            message: `${productData_from_db.name}: Only ${productData_from_db.stock} available`
          });
          storeHasStockIssues = true;
        }
        
        // Check if price changed and update
        if (productData_from_db.price !== cartProduct.price) {
          productData.price_changed = true;
          productData.old_price = cartProduct.price;
          productData.current_price = productData_from_db.price;
          productData.subtotal = productData_from_db.price * cartProduct.quantity;
          storeSubtotal += productData_from_db.price * cartProduct.quantity;
          totalPrice += productData_from_db.price * cartProduct.quantity;
          needsUpdate = true;
        } else {
          storeSubtotal += cartProduct.subtotal_price;
          totalPrice += cartProduct.subtotal_price;
        }

        storeProducts.push(productData);
      }

      // Only add store if it has products
      if (storeProducts.length > 0) {
        processedStores.push({
          store_id: storeInfo?._id || store.owner_store_id,
          store_name: storeInfo?.store_name || "Unknown Store",
          products: storeProducts,
          store_subtotal: storeSubtotal,
          has_stock_issues: storeHasStockIssues,
          total_quantity: storeProducts.reduce((sum, p) => sum + p.quantity, 0)
        });
      }
    }

    // Auto-update cart if prices changed
    if (needsUpdate) {
      cart.total_price = totalPrice;
      
      // Update store subtotals and product subtotals
      for (let i = 0; i < cart.products.length; i++) {
        let newStoreSubtotal = 0;
        for (let j = 0; j < cart.products[i].products.length; j++) {
          const productId = cart.products[i].products[j].prod_id;
          const dbProduct = await productModel.findById(productId);
          if (dbProduct && dbProduct.price !== cart.products[i].products[j].price) {
            cart.products[i].products[j].price = dbProduct.price;
            cart.products[i].products[j].subtotal_price = dbProduct.price * cart.products[i].products[j].quantity;
          }
          newStoreSubtotal += cart.products[i].products[j].subtotal_price;
        }
        cart.products[i].store_subtotal = newStoreSubtotal;
      }
      
      await cart.save();
    }

    // Prepare cart summary
    const cartSummary = {
      total_items: totalItems,
      total_price: totalPrice,
      total_stores: processedStores.length,
      has_stock_issues: stockIssues.length > 0,
      stock_issues_count: stockIssues.length,
      is_cart_empty: totalItems === 0,
      was_merged: wasMerged,
      ...(needsUpdate && { auto_updated: true })
    };

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

module.exports = getCartProducts;