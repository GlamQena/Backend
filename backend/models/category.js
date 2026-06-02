const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
      unique: true,
    },

    icon: {
      type: String,
      default: "📦",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    totalProducts: {
      type: Number,
      default: 0,
      min: 0,
    },

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
