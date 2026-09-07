const productModel = require("../../models/product");
const orderModel = require("../../models/order");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const reviewModel = require("../../models/review");

const rateOrderProductController = async (req, res) => {
  try {
    let { productId, rate, comment = "" } = req.body;
    rate = Number(rate);
    const orderId = req.params.id;
    const clientId = req.user.id;

    // Input Validation
    if (!productId || !rate) {
      return res.status(400).json({ 
        message: "You must provide the product id and a rate [1:5] stars" 
      });
    }

    if (rate > 5 || rate < 1) {
      return res.status(400).json({ 
        message: "Rate must be in range [1:5] stars" 
      });
    }

    // Get all necessary data in parallel (better performance)
    const [foundProduct, order] = await Promise.all([
      productModel.findById(productId),
      orderModel.findById(orderId)
    ]);

    // Validate Product
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate Order
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate Order Ownership
    if (order.user_id.toString() !== clientId.toString()) {
      return res.status(403).json({ message: "You can only rate products from your own orders" });
    }

    // Validate Order Status
    if (order.status !== "تم التوصيل") {
      return res.status(400).json({ message: "Order must be delivered to rate its products" });
    }

    // Validate Product in Order
    const storeOrderProducts = order.products.find(
      (storeProds) => storeProds.owner_store_id.toString() === foundProduct.owner_store_id.toString()
    );
    
    if (!storeOrderProducts) {
      return res.status(400).json({ message: "Product not found in this order" });
    }

    const orderProductExists = storeOrderProducts.products.find(
      (prod) => prod.prod_id.toString() === productId.toString()
    );
    
    if (!orderProductExists) {
      return res.status(400).json({ message: "Product not found in this order" });
    }

    // Check if User Already Reviewed This Product
    const existingReview = await reviewModel.findOne({ 
      client_id: clientId, 
      product_id: productId 
    });
    
    if (existingReview) {
      return res.status(400).json({ message: "You have already rated this product" });
    }

    // Create Review
    const savedReview = await reviewModel.create({
      client_id: clientId,
      product_id: productId,
      rate,
      comment: comment.trim(),
    });

    // Update Store Owner Stats
    const storeOwner = await storeOwnerModel.findById(foundProduct.owner_store_id);
    if (storeOwner) {
      const totalRates = storeOwner.total_rates || 0;
      const currentTotalRating = storeOwner.average_rating * totalRates; //rates_sum
      const newAverageRating = (currentTotalRating + rate) / (totalRates + 1);
      
      storeOwner.average_rating = Math.round(newAverageRating * 100) / 100; //round to the nearest 2 decimal places corresponds to the toFixed method for the String
      storeOwner.total_rates = totalRates + 1;
      await storeOwner.save();
    }

    // Update Product Stats
    const productStats = await reviewModel.aggregate([
      { $match: { product_id: foundProduct._id } },
      { $group: {
          _id: null,
          avg: { $avg: "$rate" },
          count: { $sum: 1 }
        }
      }
    ]);

    if (productStats.length > 0) {
      foundProduct.average_rating = Math.round(productStats[0].avg * 100) / 100;
      foundProduct.total_rates = productStats[0].count;
    } else {
      foundProduct.average_rating = rate;
      foundProduct.total_rates = 1;
    }

    foundProduct.hasReviewed = true;
    await foundProduct.save();

    // Return Response
    res.status(201).json({ 
      message: "Product rated successfully", 
      review: savedReview,
      storeStats: storeOwner ? {
        average_rating: storeOwner.average_rating,
        total_rates: storeOwner.total_rates
      } : null,
      productStats: {
        average_rating: foundProduct.average_rating,
        total_rates: foundProduct.total_rates
      }
    });

  } catch (error) {
    console.error("FULL ERROR =>", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

module.exports = rateOrderProductController;