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

    // store_owner_id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "store_owner",
    //   required: true,
    //   index: true,
    // },

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
    },  //can be deactivated by the admin if he found the review isn't fair or from annoying client 
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const reviewModel = mongoose.model("review", ReviewSchema);

module.exports = reviewModel;
