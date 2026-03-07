import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
    },
    storeOwner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop_owner",
    },
    amount: {
      type: Number,
    },
    delivery_cost: {
      type: Number,
    },
    currency: {
      type: String,
      default: "EGP",
    },
    payment_method: {
      type: String,
      enum: ["card", "cash", "wallet"],
    },
    payment_status: {
      type: String,
      enum: ["pending", "refunded", "failed", "completed"],
    },
    profit_breakdown: {
      type: {
        platformCommission: {
          type: Number,
        },
        store_payout: {
          type: Number,
        },
        delivery_company: {
          type: Number,
        },
      },
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

const paymentModel = mongoose.model("payment", PaymentSchema);

export default paymentModel;
