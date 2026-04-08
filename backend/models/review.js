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

    store_owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "store_owner",
      required: true,
      index: true,
    },

    rate: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
    },

    images : {
      type: [String],
      validate:{
        validator: (v)=> {
          if(v.length===0)
            return true;  //pass if no images provided making it optional
          return v>=1 && v<=7;
        },
        message: (props)=> "you must provide at least 3 images for the product but don't exceed 7"
      },
      default: []
    },

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

    isApproved: {
      type: Boolean,
      default: false,
    }, //by the product storeOwner

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
