const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
      required: true,
      index: true,
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
      index: true,
    },

    rate: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    }, 
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const reviewModel = mongoose.model("review", ReviewSchema);

module.exports = reviewModel;
