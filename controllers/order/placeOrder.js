const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Product = require("../../models/product");
const mongoose = require("mongoose");
const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");

const placeOrderController = async (req, res) => {
  try {
    const userId = req.user.id;
    let userIdObj = null;
    if (userId) {
      try {
        userIdObj = typeof userId === 'string' 
          ? new mongoose.Types.ObjectId(userId) 
          : userId;
      } catch (err) {
        console.error("Invalid user_id format:", userId);
      }
    }

    let cart = null;
    if (userIdObj) {
      cart = await Cart.findOne({user_id: userIdObj });
      console.log(`fetched cart for user_id ${userIdObj}=>`, cart);
    }

    if (!cart && userId) {
        cart = await Cart.findOne({ user_id: userId.toString() });
        console.log("Query with string result:", cart ? "Found" : "Not found");
    }

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    let orderProducts = [];
    let totalQuantity = 0;
    const updatedStores = new Set();

    for (const storeProds of cart.products) {
      let storeSubtotal = 0;
      const storeProducts = [];
      const storeId = storeProds.owner_store_id;

      // Get store owner to validate existence
      const storeOwner = await storeOwnerModel.findById(storeId);
      if (!storeOwner) {
        return res.status(404).json({ 
          message: `Store owner not found for store ID: ${storeId}` 
        });
      }

      for (const item of storeProds.products) {
        const product = await Product.findById(item.prod_id);

        if (!product) {
          // Remove invalid product from cart
          for (const store of cart.products) {
            store.products = store.products.filter(
              (p) => p.prod_id.toString() !== item.prod_id.toString()
            );
          }
          cart.products = cart.products.filter((s) => s.products.length > 0);
          await cart.save();

          return res.status(400).json({
            message: `A product in your cart is no longer available and has been removed. Please review your cart and try again.`
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Not enough stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          });
        }

        const subtotal = product.price * item.quantity;
        storeProducts.push({
          prod_id: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal_price: subtotal, // Will be recalculated by pre-validate hook
        });

        storeSubtotal += subtotal;
        totalQuantity += item.quantity;

        // Update product stock
        product.stock -= item.quantity;
        await product.save();
      }

      orderProducts.push({
        owner_store_id: storeId,
        products: storeProducts,
        store_subtotal: storeSubtotal, // Will be recalculated by pre-validate hook
      });

      // Update store owner's total orders (only once per store)
      if (!updatedStores.has(storeId.toString())) {
        updatedStores.add(storeId.toString());
        storeOwner.total_orders = (storeOwner.total_orders || 0) + 1;
        await storeOwner.save();
      }
    }

    const deliveryFee = 50;
    totalPrice += deliveryFee;

    // Create order
    const order = new Order({
      user_id: userId,
      products: orderProducts,
      total_quantity: totalQuantity,
      subtotal_price: totalPrice - deliveryFee,
      total_price: totalPrice,
      status: "قيد الانتظار",
    });
    await order.save();
    
    // Increase total_orders for client
    await clientModel.findByIdAndUpdate(userId, {$inc: {totalOrders: +1, totalSpent: order.total_price}});
    
    // Clear cart
    cart.products = [];
    cart.total_price = 0;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: order,
      orderSummary: {
        orderId: order._id,
        subtotal: order.subtotal_price,
        deliveryCost: order.delivery_cost,
        total: order.total_price,
        totalItems: totalQuantity,
        status: order.status,
        stores: order.products.map(store => ({
          storeId: store.owner_store_id,
          subtotal: store.store_subtotal,
          productsCount: store.products.length
        }))
      }
    });

  } catch (error) {
    console.error(`error placing order: ${JSON.stringify(error)}`);
    res.status(500).json({ message: "internal Server error", error: error.message});
  }
};

module.exports = placeOrderController;