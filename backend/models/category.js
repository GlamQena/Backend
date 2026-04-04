const mongoose = require("mongoose");
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

      enum: [
        "Cleansers",
        "Moisturizers",
        "Serums",
        "Sun Care",
        "Masks",
        "Toners",
        "Concealer",
        "Foundation",
        "Lipstick",
        "Blusher",
        "Eyeshadow",
        "Mascara",
        "Eyeliner",
        "Brushes",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // productIds:  [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "product",
    //   index: true,
    // }], --> not needed as we can get the products of a category by querying the products collection with the category_id field

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

const categoryModel = mongoose.model("category", CategorySchema);

module.exports = categoryModel;
