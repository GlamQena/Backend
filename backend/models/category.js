const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
      unique: true,
      enum: 
      // [
      //   "Cleansers",
      //   "Moisturizers",
      //   "Serums",
      //   "Sun Care",
      //   "Masks",
      //   "Toners",
      //   "Concealer",
      //   "Foundation",
      //   "Lipstick",
      //   "Blusher",
      //   "Eyeshadow",
      //   "Mascara",
      //   "Eyeliner",
      //   "Brushes",
      //   "Others"
      // ],
      ["العناية بالبشرة", "المكياج", "الأدوات", "العناية بالجسم", "العناية بالشعر", "العناية بالرجال", "أخرى"]
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
