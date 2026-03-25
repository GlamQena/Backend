const mongoose= require("mongoose");
const { maxLength } = require("zod");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
      unique: true,
      //TODO=> add enum values here based on the skinTypes & concerns and the fake data available categories
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    productIds:  [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      index: true,
    }],

    isActive: {
      type: Boolean,
      default: true,
    }, //in order to not be deleted permanently while its products depend on it.
  },

  {
    timestamps: true,
    versionKey: false,
  },
);


const categoryModel = mongoose.model("category",CategorySchema);

module.exports= categoryModel;