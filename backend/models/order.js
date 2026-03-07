import mongoose from "mongoose";

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
    total_amount: {
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
    },
    review_IDs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "review",
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payment",
    },
  },
  {
    timestamps: true,
  },
);

const orderModel = mongoose.model("order",OrderSchema)

export default orderModel
