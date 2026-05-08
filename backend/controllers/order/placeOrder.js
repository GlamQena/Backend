const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Product = require("../../models/product");

const placeOrderController= async(req, res)=> {
  try {
    const userId = req.user.id;
    
    //جلب السلة 
    const cart = await Cart.findOne({ user_id: userId  }).populate({path: "products.owner_store_id", select: "_id store_name"});

    console.log("cart => ",cart, "userId => ", userId);

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
  
    let totalPrice = 0;
    let store_subtotal = 0;
    let orderProducts = [];
    let totalQuantity = 0;

    for (const storeProds of cart.products) {
      let {_id, store_name}= storeProds.owner_store_id;

      const storeProducts= [];

      for(let prod of storeProds.products){
        const product = await Product.findOne({_id: prod.prod_id, owner_store_id: _id});

        if (!product) {
            console.log(`cart product ${prod.name} for store ${store_name} not found`);
            return res.status(400).json({ message: `A cart product not found` });
        }

        if (product.stock < prod.quantity) {
            return res.status(400).json({message: `Not enough stock for ${product.name}`});
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
        owner_store_id:_id,
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
      subtotal_price: totalPrice-50,
      total_price: totalPrice,
      status: "قيد الانتظار",
    });

   // تقليل المخزون 
   for (const storeProds of cart.products) {
    for(const item of storeProds.products)
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