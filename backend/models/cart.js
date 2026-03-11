const mongoose= require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          prod_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
          },
          quantity: {
            type: Number,
          },
          subtotal_price: {
            type: Number,
          },
        },
      ],
    },

    total_price: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const cartModel = mongoose.model("cart",CartSchema);
module.exports= cartModel;