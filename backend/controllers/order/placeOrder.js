const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Product = require("../../models/product");



const placeOrderController= async(req, res)=> {
  try {
    const userId = req.user.id;
    
    //جلب السلة 
    const cart = await Cart.findOne({ client_id: userId  });
    
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
  
    let totalPrice = 0;
    let orderProducts = [];
    let totalQuantity = 0;

    for (const item of cart.products) {
       const product = await Product.findById(item.prod_id);

       if (!product) {
           return res.status(400).json({ message: "Product not found in cart" });
      }

       if (product.stock < item.quantity) {
           return res.status(400).json({message: `Not enough stock for ${product.name}`});
        }

       const subtotal = product.price * item.quantity;

       orderProducts.push({
           prod_id: product._id,
           quantity: item.quantity,
           subtotal_price: subtotal, 
      });

      totalPrice += subtotal;
      totalQuantity += item.quantity;

    }


  
    const deliveryFee = 50;
    totalPrice += deliveryFee;

    // Create order
    const order = await Order.create({
      user_id: userId,
      Products: orderProducts,
      total_quantity: totalQuantity,
      total_price: totalPrice,
      status: "pending",
    });

   // تقليل المخزون 
   for (const item of cart.products) {
        await Product.findByIdAndUpdate(item.prod_id, {
           $inc: { stock: -item.quantity },
        });
    }

    // تفريغ السلة
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

module.exports= placeOrderController;