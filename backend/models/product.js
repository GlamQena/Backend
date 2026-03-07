import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    owner_store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop_owner",
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
    },
    ingredients: {
      type: [String],
    },
    skinType: {
      type: String,
      enum: ["oily", "dry", "combination", "sensitive", "normal"],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
  },
  {
    timestamps: true,
  },
);

let productModel = mongoose.model("product", ProductSchema);

export default productModel;
