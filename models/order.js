const mongoose = require("mongoose");
const COMMISSION_RATES = require("../config/commisions");
const productModel = require("../models/product.js");

// consistent 2-decimal rounding that returns a Number, not a String.
const round2 = (n) => Math.round(n * 100) / 100;

const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    products: {
      type: [
        {
          owner_store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "store_owner",
            required: true,
          },

          products: [
            {
              prod_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true,
                index: true,
              },
              name: {
                type: String,
                trim: true,
              },
              price: {
                // Snapshot of the unit price at the time of purchase.
                // Filled by the pre-validate hook from the product document.
                // Never trust the client-supplied value.
                type: Number,
                min: 0,
              },
              quantity: {
                type: Number,
                max: 99,
                min: 1,
                required: true,
              },
              subtotal_price: {
                type: Number,
                required: true,
                min: 0,
              }, // price * quantity
            },
          ],

          store_subtotal: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],

      required: true,

      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "cannot checkout empty order",
      },
    },

    subtotal_price: {
      type: Number,
      required: true,
      min: 0,
    }, // total products price

    currency: {
      type: String,
      default: "EGP",
    },

    delivery_cost: {
      type: Number,
      default: 50,
      min: 0,
    }, // bosta estimated_delivery_cost + platform commission

    total_price: {
      type: Number,
      required: true,
      min: 0,
    }, // products_price + delivery_cost

    payment: {
      method: {
        type: String,
        enum: ["card", "cash", "wallet"],
        default: "card",
      },

      status: {
        type: String,
        enum: [
          "قيد الانتظار", // pending to enter card or wallet details for paymob payment or for the cash to be collected on delivery
          "تم الاسترداد", // when the client cancels the order after payment completion and the order wasn't delivered yet or the order return is accepted
          "فشل",
          "مكتمل",
          "قيد المعالجة", // processing on paymob
        ],
        default: "قيد الانتظار",
      },

      completedAt: {
        type: Date,
      },

      paymob_transaction_id: String, // for card and wallet payment
      paymob_order_id: String,
      wallet_phone: String,
      wallet_provider: String,
    },

    status: {
      type: String,
      enum: [
        "قيد الانتظار",  // pending
        "جاري التجهيز", // preparing (by the store owner)
        "جاهز للتوصيل", // ready to deliver (all store owners finished preparing)
        "قيد التوصيل",  // out-to-deliver (admin-managed for now)
        "ملغي",         // cancelled (failed or returned)
        "تم التوصيل",   // delivered
      ],
      default: "قيد الانتظار",
      index: true,
    },

    deliveredAt: Date,
    cancelledAt: Date,

    cancel_reason: {
      type: String,
    },

    profit_breakdown: {
      type: {
        platform_revenue: {
          products: {
            type: Number,
            min: 0,
            required: true,
          }, // 15% commission
          delivery: {
            type: Number,
            min: 0,
            default: 10,
          }, // 20% commission -> 25% * bosta_estimated_cost
        },

        stores_payout: [
          {
            owner_store_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "store_owner",
              required: true,
            },
            amount: {
              type: Number,
              min: 0,
              required: true,
            },
          },
        ],
      },

      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

OrderSchema.pre("validate", async function (next) {
  try {
    // ---------------------------------------------------------------
    // 1. reset ALL derived money fields
    // ---------------------------------------------------------------
    this.subtotal_price = 0;
    this.profit_breakdown = {
      platform_revenue: { products: 0, delivery: this.profit_breakdown?.platform_revenue?.delivery ?? 10 },
      stores_payout: [],
    };

    if (!Array.isArray(this.products) || this.products.length === 0) {
      // Let schema validation reject the empty-order case.
      return next();
    }

    // ---------------------------------------------------------------
    // 2. Collect all product IDs to fetch in one round trip
    // ---------------------------------------------------------------
    const allProductIds = [];
    for (const storeGroup of this.products) {
      for (const item of storeGroup.products) {
        if (item.prod_id) allProductIds.push(item.prod_id.toString());
      }
    }

    const dbProducts = await productModel
      .find({ _id: { $in: allProductIds } })
      .select("_id name price owner_store_id")
      .lean();

    const dbProductMap = new Map(
      dbProducts.map((p) => [p._id.toString(), p])
    );

    // ---------------------------------------------------------------
    // 3. Recompute per-store subtotals + payouts
    // ---------------------------------------------------------------
    for (const storeGroup of this.products) {
      // Trust the product's owner_store_id, not the client-supplied one.
      let resolvedStoreId = storeGroup.owner_store_id;

      storeGroup.store_subtotal = 0;

      for (const item of storeGroup.products) {
        const dbProduct = dbProductMap.get(item.prod_id?.toString());

        if (!dbProduct) {
          return next(
            new Error(`Product not found: ${item.prod_id}`)
          );
        }

        // Never trust the client price — use the DB price.
        item.price = dbProduct.price;

        // Freeze the store attribution at purchase time.
        // If the client sent a mismatched owner_store_id, we override it.
        if (
          !resolvedStoreId ||
          resolvedStoreId.toString() !== dbProduct.owner_store_id.toString()
        ) {
          resolvedStoreId = dbProduct.owner_store_id;
          storeGroup.owner_store_id = dbProduct.owner_store_id;
        }

        // snapshot the product name too, in case the client
        // omitted or forged it. Keeps order history readable even if the
        // product is later renamed or deleted.
        if (!item.name) {
          item.name = dbProduct.name || "منتج";
        }

        // numeric rounding, not string toFixed().
        item.subtotal_price = round2(item.price * item.quantity);
        storeGroup.store_subtotal = round2(
          storeGroup.store_subtotal + item.subtotal_price
        );
      }

      // -------------------------------
      // 4. Accumulate per-store payout
      // -------------------------------
      const storeId = storeGroup.owner_store_id;
      const amount = round2(
        COMMISSION_RATES.STORE_PAYOUT * storeGroup.store_subtotal
      );

      const existingPayout = this.profit_breakdown.stores_payout.find(
        (s) => s.owner_store_id.toString() === storeId.toString()
      );

      if (existingPayout) {
        existingPayout.amount = round2(existingPayout.amount + amount);
      } else {
        this.profit_breakdown.stores_payout.push({
          owner_store_id: storeId,
          amount,
        });
      }
      
      this.subtotal_price = round2(
        this.subtotal_price + storeGroup.store_subtotal
      );
    }

    // ---------------------------------------------------------------
    // 5. Platform product commission
    // ---------------------------------------------------------------
    this.profit_breakdown.platform_revenue.products = round2(
      COMMISSION_RATES.PRODUCT_COMMISSION * this.subtotal_price
    );

    // ---------------------------------------------------------------
    // 6. Delivery cost + total
    // ---------------------------------------------------------------
    if (
      this.delivery_cost === undefined ||
      this.delivery_cost === null ||
      isNaN(this.delivery_cost)
    ) {
      this.delivery_cost = 50;
    }

    this.total_price = round2(this.subtotal_price + this.delivery_cost);

    next();
  } catch (error) {
    next(error);
  }
});

const orderModel = mongoose.model("order", OrderSchema);

module.exports = orderModel;