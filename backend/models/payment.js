const mongoose= require("mongoose");

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
    }, //total products cost

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
      enum: ["pending", "refunded", "failed", "completed", "processing"],
    },//refunded(استرجع) and pending related to 'cash', while failed and processing for 'card' and 'wallet'. 
    //'completed' include all types.

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

  { timestamps: true,
    versionKey: false,
  },
);

const paymentModel = mongoose.model("payment", PaymentSchema);

module.exports= paymentModel;
