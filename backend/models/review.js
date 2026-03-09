const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },

    store_owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "store_owner",
    },

    rate: {
      type: Number,
      min: 0,
      max: 5,
    }, //will be integer not double value initially

    comment: {
      type: String,
    },

    // images :[URL],

    // replies:
    // [{
    //   user_id:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"user"
    //   },

    //   user_role:{
    //       type: String,
    //       index: true,
    //       enum: ["user", "client", "store_owner", "admin"],
    //       default: "user",
    //   },

    //   comment:{
    //     type:String
    //   },

    //   createdAt:{
    //     type:Date
    //   }
    // }],

    isApproved: Boolean, //by the product storeOwner

    isActive: Boolean,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const reviewModel = mongoose.model("review", ReviewSchema);

module.exports = reviewModel;
