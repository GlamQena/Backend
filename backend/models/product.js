const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    owner_store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "store_owner",
      required: true,
      index: true,
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 100,
    },

    description: {
      type: String,
      trim: true,
      max: 600,
    },

    price: {
      type: Number,
      min: 0,
      max: 9999.99,
      required: true,
    },

    stock: {
      type: Number,
      min: 0,
      max: 10000,
      required: true,
    }, //available quantity

    ingredients: {
      type: [{
        type: String,
        trim: true,
        min: 3,
        max: 100
      }],
      default: [],
      validate:{
        validator: (val) => val.length<=30,
        error: "ingredients mustn't exceed 30 components"
      }
    },

    images :{
      type: [String],
      validate:{
        validator: (v)=> v.length>=1 && v.length<=7,
        error: (data)=> "you must provide at least 1 image for the product and don't exceed 7"
      }
    },

    weight:{
      type: Number,
      min: 0,
      max: 5,
      default: 0.2//in KG
    }, //affect delivery cost

    dimensions: {
      type: {
        length: { type: Number, default: 15 , min:1, max:100},
        width: { type: Number, default: 10 , min:1, max:100},
        height: { type: Number, default: 5 , min:1, max:100}
      },

      default: {
        length: 15,
        width: 10,
        height: 5
      }
    },

    skinType: {
      type: String,
      enum: ['جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية'],
      default: "عادية",
    },

    hasReviewed: {
      type: Boolean,
      default: false,
    },

    average_rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    total_rates: {
      type: Number,
      default: 0,
    },
  
    // review_IDs: {
    //   type: [mongoose.Schema.Types.ObjectId],
    //   ref: "review",
    //   default: [],
    // },

    addedAt: Date,

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

let productModel = mongoose.model("product", ProductSchema);

module.exports = productModel;
