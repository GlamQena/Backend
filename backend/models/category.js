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
    },
  },
  {
    timestamps: true,
  },
);


const categoryModel = mongoose.model("category",CategorySchema)

export default categoryModel