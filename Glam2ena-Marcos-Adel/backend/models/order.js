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
              name: {
                type: String,
                trim: true,
              },
              price: {
                type: Number,
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
      // required: true,
      default: 50,
      min: 0,
    }, //bosta estimated_delivery_cost + platform commission

    total_price: {
      type: Number,
      required: true,
      min: 0,
    }, //products_price + delivery_cost

    // bosta: {
    //   trackingNumber: String, 
    //   trackingUrl: String,        // Bosta's tracking page
    //   status: String,             // Synced from Bosta
    // },

    payment:{
      method: {
        type: String,
        enum: ["card", "cash", "wallet"],
        default: "card",
      },

      status: {
        type: String,
        enum: [
                "قيد الانتظار", //pending to enter cad or wallet details for paymob payment or for the cash to be collected on delivery
                "تم الاسترداد",  //when the client cancel the order after payment completion adn the order wasn't delivered yet or the order return is accepted
                "فشل",
                "مكتمل",
                "قيد المعالجة" //processing on paymob
        ],
        default: "قيد الانتظار",
      },

      completedAt: {
        type: Date,
      },

      paymob_transaction_id: String, //for wallet payment

      paymob_order_id: String,
    },

    status: {
      type: String,
      enum: [
              "قيد الانتظار",    // pending
              "جاري التجهيز",   // preparing (picked up from store owner)
              "قيد التوصيل",    // out-to-deliver (in_transit or out_for_delivery)
              "ملغي",           // cancelled (failed or returned)
              "تم التوصيل"      // delivered
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
          }, //15% commission
          delivery: {
            type: Number,
            min: 0,
            // required: true,
            default: 10,
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

        // bosta_delivery_cost: {
        //   type: Number,
        //   min: 0,
        //   required: true,
        // }, //calculated by the bosta estimated_delivery_cost api
      },

      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

OrderSchema.pre("validate", function(next) {
  try{
    if (!this.profit_breakdown) {
      this.profit_breakdown = {
        platform_revenue: { products: 0, delivery: 10 },
        stores_payout: []
      };
    }
    
    this.subtotal_price=0;

    this.products.forEach((store=>{
      store.store_subtotal=0;

      store.products.forEach((prod)=>{
        prod.subtotal_price= prod.price * prod.quantity;
        store.store_subtotal+= prod.subtotal_price;
      });

      const amount = (COMMISSION_RATES.STORE_PAYOUT * store.store_subtotal).toFixed(2);;
      const store_payout= this.profit_breakdown.stores_payout.find(s=> s.owner_store_id==store.owner_store_id);
      if(store_payout)
        store_payout.amount = amount;
      else
        this.profit_breakdown.stores_payout.push({owner_store_id: store.owner_store_id, amount});

      this.subtotal_price+=store.store_subtotal;
    }));

    this.profit_breakdown.platform_revenue.products= (COMMISSION_RATES.PRODUCT_COMMISSION * this.subtotal_price).toFixed(2);
    // this.profit_breakdown.platform_revenue.delivery= ((1/COMMISSION_RATES.DELIVERY_PAYOUT) * COMMISSION_RATES.DELIVERY_COMMISSION * this.profit_breakdown.bosta_delivery_cost).toFixed(2);
    // this.delivery_cost= this.profit_breakdown.bosta_delivery_cost + this.profit_breakdown.platform_revenue.delivery;
    this.total_price= this.subtotal_price + this.delivery_cost;

    next();
  }catch(error){
    next(error);
  }
});

const orderModel = mongoose.model("order", OrderSchema);

module.exports= orderModel;
