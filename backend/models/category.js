import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    description: {
      type: String,
    },

    productIds: {
      type: [mongoose.Schema.Types.ObjectId],
    },

    isActive: {
      type: Boolean,
    }, //in order to not be deleted permanently while its products depend on it.
  },

  {
    timestamps: true,
    versionKey: false,
  },
);


const categoryModel = mongoose.model("category",CategorySchema)

export default categoryModel