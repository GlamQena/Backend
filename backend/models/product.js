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
    },

    description: {
      type: String,
    },

    price: {
      type: Number,
      min: 0,
      required: true,
    },

    stock: {
      type: Number,
      min: 0,
      required: true,
    }, //available quantity

    ingredients: {
      type: [String],
    },

    images :{
      type: [String],
      validate:{
        validator: (v)=> v.length>=3 && v.length<=7,
        error: (data)=> "you must provide at least 3 images for the product but don't exceed 7"
      }
    },

    weight:{
      type: Number,
      default: 0.5 //in KG
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
      enum: ["oily", "dry", "combination", "sensitive", "normal"],
      default: "normal",
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

    addeddAt: Date,

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
