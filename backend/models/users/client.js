const mongoose = require("mongoose");
const userModel = require("./user.js");

const ClientSchema = new mongoose.Schema({
  skinType: {
    type: String,
    enum: {
      values: ['جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية'],
    },
    default: "عادية",
    trim: true,
    lowercase: true,
  },

  skinConcerns: {
    type: [String],
    enum: ['حب الشباب', 'تجاعيد', 'جفاف', 'تصبغات', 'هالات سوداء'],
    validate: {
      validator: (concerns) => {
        return concerns.length <= 3;
      },
      message: "can't choose more than 5 skin concerns!",
    },
    default: [],
  }, //for ai-based recommendations (future feature)

  wishlist: {
    type: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
          index: true,
        },

        productName: {
          type: String,
          required: true,
          trim: true,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        addedAt: {
          type: Date,
          default: Date.now,
          index: true,
        },

        inStock: Boolean,

        image: String,
      },
    ],
    default: [],
  }, //list of products interest the client but can't afford them or out-of-stock

  totalSpent: {
    type: Number,
    default: 0,
    min: 0,
  }, //the costs client afford his lifeTime with our platform

  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  //TODO-> add address details required for paymob payment billing data and for production later.
}); //the used term 'amount' represent the cost

const clientModel = userModel.discriminator("client", ClientSchema);
module.exports = { userModel, clientModel };
