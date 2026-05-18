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

    for (const storeProds of cart.products) {
      let store_subtotal = 0;
      const storeProducts = [];

      for (let prod of storeProds.products) {
        const product = await Product.findById(prod.prod_id);

        if (!product) {
          for (const store of cart.products) {
            store.products = store.products.filter(
              (p) => p.prod_id.toString() !== prod.prod_id.toString()
            );
          }
          cart.products = cart.products.filter((s) => s.products.length > 0);
          await cart.save();

          // return res.status(400).json({
          //   message: `A product in your cart is no longer available and has been removed. Please review your cart and try again.`
          // });
          continue;
        }

        if (product.stock < prod.quantity) {
          return res.status(400).json({
            message: `Not enough stock for ${product.name}`
          });
        }

        const subtotal = product.price * prod.quantity;
        storeProducts.push({
          prod_id: product._id,
          name: product.name,
          price: product.price,
          quantity: prod.quantity,
          subtotal_price: subtotal,
        });

        store_subtotal += subtotal;
        totalQuantity += prod.quantity;
      }

      orderProducts.push({
        owner_store_id: storeProds.owner_store_id,
        products: storeProducts,
        store_subtotal
      });

      totalPrice += store_subtotal;
    }

    const deliveryFee = 50;
    totalPrice += deliveryFee;

    // Create order
    const order = await Order.create({
      user_id: userId,
      products: orderProducts,
      total_quantity: totalQuantity,
      subtotal_price: totalPrice - deliveryFee,
      total_price: totalPrice,
      status: "قيد الانتظار",
    });

    // Decrease stock
    for (const storeProds of cart.products) {
      for (const item of storeProds.products) {
        await Product.findByIdAndUpdate(item.prod_id, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    await clientModel.findByIdAndUpdate(userId, {$inc: {totalOrders: +1}});
    await storeOwnerModel.findByIdAndUpdate(userId, {$inc: {total_orders: +1}});
    
    // Clear cart
    cart.products = [];
    cart.total_price = 0;
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = placeOrderController;