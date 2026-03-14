const mongoose = require("mongoose");
const userModel = require("./user.js");

const ClientSchema = new mongoose.Schema({
  cart_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cart",
    required: true,
    index: true,
  },

  skinType: {
    type: String,
    enum: {
      values: ["oily", "dry", "combination", "sensitive", "normal"],
    },
    default: "normal",
    trim: true,
    lowercase: true,
  },

  skinConcerns: {
    type: [String],
    enum: [
      "acne",
      "aging",
      "dryness",
      "redness",
      "dark_circles",
      "oiliness",
      "blackheads",
      "whiteheads",
    ],
    validate: {
      validator: function (concerns) {
        return concerns.length <= 5;
      },
      error: "can't choose more than 5 skin concerns!",
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
    type: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },

      lastUpdated: {
        type: Date,
        default: Date.now,
      }, //track the date of the last order paid to suggest leave a review on it

      history: [
        {
          amount: Number,
          orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
          date: { type: Date, default: Date.now },
        },
      ], //show in the storeOwner dashboard in the interactive clients list
    },
  }, //the costs client afford its lifeTime with our website

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
