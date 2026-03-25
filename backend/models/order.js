const mongoose= require("mongoose");
const COMMISSION_RATES= require("../config/commisions");

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
          owner_store_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "store_owner",
            required: true,
          },

          products:[
            {
              prod_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true,
                index: true,
              },
              quantity: {
                type: Number,
                min: 1,
                required: true,
              },
              subtotal_price: {
                type: Number,
                required: true,
                min: 0,
              }, //price*quantity
            },
          ],

          store_subtotal:{
            type: Number,
            required: true,
            min: 0,
          }
        }
      ],

      required: true,

      validate:{
        validator: (v)=> v.length>0,
        message: "cann't checkout empty order"
      }
    },

    subtotal_price: {
      type: Number,
      required: true,
      min: 0,
    }, //total products price

    currency: {
      type: String,
      default: "EGP",
    },

    delivery_cost: {
      type: Number,
      required: true,
      min: 0,
    }, //bosta estimated_delivery_cost + platform commission

    total_price: {
      type: Number,
      required: true,
      min: 0,
    }, //products_price + delivery_cost

    bosta: {
      trackingNumber: String, 
      trackingUrl: String,        // Bosta's tracking page
      status: String,             // Synced from Bosta
    },

    payment:{
      method: {
        type: String,
        enum: ["card", "cash", "wallet"],
        required: true,
      },

      status: {
        type: String,
        enum: ["pending", "refunded", "failed", "completed", "processing"],
        default: "pending",
      },

      completedAt: {
        type: Date,
      },

      paymob_transaction_id: String,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "preparing", //picked up (shipped from the store owner)
        "out-to-deliver", //in_transit or out_for_delivery
        "cancelled", //failed or returned
        "delivered",
      ],
      default: "pending",
      index: true,
    },

    deliveredAt: Date,

    cancelledAt: Date,

    cancel_reason: {
      type: String,
    },

    hasReviewed: {
      type: Boolean,
      default: false,
    }, //to request the customer to leave a review for its products

    profit_breakdown: {
      type: {
        platform_revenue: {
          products: {
            type: Number,
            min: 0,
            required: true,
          }, //15% commission
          delivery: {
            type: Number,
            min: 0,
            required: true,
          }, //20% commission    25% * bosta_estimated_cost
        },

        stores_payout: [
          {
            owner_store_id:{
              type: mongoose.Schema.Types.ObjectId,
              ref: "store_owner",
              required: true,
            },
            amount:  {
              type: Number,
              min: 0,
              required: true,
            },
          }
        ],

        bosta_delivery_cost: {
          type: Number,
          min: 0,
          required: true,
        }, //calculated by the bosta estimated_delivery_cost api
      },

      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

OrderSchema.pre("save", function(next) {
  this.subtotal_price=0;

  this.products.forEach((store=>{
    store.store_subtotal=0;

    store.products.forEach((prod)=>{
      store.store_subtotal+= prod.subtotal_price;
    });

    const store_payout= this.profit_breakdown.stores_payout.find(s=> s.owner_store_id==store.owner_store_id);
      if(store_payout)
        store_payout.amount = (COMMISSION_RATES.STORE_PAYOUT * store.store_subtotal).toFixed(2);

    this.subtotal_price+=store.store_subtotal;
  }));

  this.profit_breakdown.platform_revenue.products= (COMMISSION_RATES.PRODUCT_COMMISSION * this.subtotal_price).toFixed(2);
  this.profit_breakdown.platform_revenue.delivery= ((1/COMMISSION_RATES.DELIVERY_PAYOUT) * COMMISSION_RATES.DELIVERY_COMMISSION * this.profit_breakdown.bosta_delivery_cost).toFixed(2);
  this.delivery_cost= this.profit_breakdown.bosta_delivery_cost + this.profit_breakdown.platform_revenue.delivery;
  this.total_price= this.subtotal_price + this.delivery_cost;

  next();
});

const orderModel = mongoose.model("order", OrderSchema);

module.exports= orderModel;
