import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    owner_store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop_owner",
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },

    name: {
      type: String,
    },

    description: {
      type: String,
    },

    price: {
      type: Number,
    },

    stock: {
      type: Number,
    }, //available quantity

    ingredients: {
      type: [String],
    },

    skinType: {
      type: String,
      enum: ["oily", "dry", "combination", "sensitive", "normal"],
    },

    hasReviewed: Boolean,
    
    review_IDs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "review",
    },
  },

  {
    timestamps: true,
    versionKEy: false,
  },
);

let productModel = mongoose.model("product", ProductSchema);

export default productModel;
