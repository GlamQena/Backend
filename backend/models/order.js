const mongoose= require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    Products: {
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

    total_quantity: {
      type: Number,
    },

    total_price: {
      type: Number,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "out-to-deliver",
        "cancelled",
        "delivered",
      ],
    },

    cancel_reason: {
      type: String,
    },

    hasReviewed: {
      type: Boolean,
    }, //to request the customer to leave a review on it

    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payment",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const orderModel = mongoose.model("order", OrderSchema);

module.exports= orderModel;
