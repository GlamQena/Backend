const Cart = require("../../models/Cart");
const Order = require("../../models/Order");
const Product = require("../../models/Product");


const placeOrderController= async(req, res)=> {
  try {
    const userId = req.user.id;
    const { address, phone , paymentMethod } = req.body;

    if (!address || !phone || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    //جلب السلة 
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
  
    let totalPrice = 0;

    for (const item of cart.items) {
       const product = item.product;

       if (!product) {
           return res.status(400).json({ message: "Product not found in cart" });
      }

       if (product.stock < item.quantity) {
           return res.status(400).json({message: `Not enough stock for ${product.name}`});
        }

        totalPrice += product.price * item.quantity;

    }

     // Create order items
    const orderItems = cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
    }));

    // Create order
    const order = await Order.create({
        user: userId,
        items: orderItems,
        totalPrice,
        paymentMethod,
        status: 'pending',
        address,
        phone,
    });

   // تقليل المخزون 
   for (const item of cart.items) {
        const product = item.product;
        product.stock -= item.quantity;
        await product.save();
    }

    // تفريغ السلة
    cart.items = [];
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

module.exports= placeOrderController;