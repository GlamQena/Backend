import mongoose from "mongoose";
import userModel from "./user.js";

const ClientSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cart",
    required: true,
    index: true,
  }, //commented until create cart model

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
      "uneven_texture",
    ],
    validate: {
      validator: function (concerns) {
        return concerns.length <= 5;
      },
      error: "can't choose more than 5 skin concerns!",
    },
  },

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

        inStock: {
          type: Boolean,
          default: true,
        },

        image: String,
      },
    ],
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
      },

      history: [
        {
          amount: Number,
          orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
          date: { type: Date, default: Date.now },
        },
      ],
    },
  }, //the costs client afford its lifeTime with our website

  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
});

const clientModel = userModel.discriminator("client", ClientSchema);
module.exports = { userModel, clientModel };
