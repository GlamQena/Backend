const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
      required: false,
    },

    session_id: {
      type: String,
      required: false,
    },

    products: {
      type: [
        {
          owner_store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "store_owner",
            index: true,
          },

          products: [
            {
              prod_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                index: true,
              },
              name: {
                type: String,
                trim: true,
              },
              price: {
                type: Number,
                min: 0,
              },
              quantity: {
                type: Number,
                max: 99,
                min: 1,
                default: 1,
              },

              subtotal_price: {
                type: Number,
                default: 0,
              },
            },
          ],

          store_subtotal: {
            type: Number,
            default: 0,
          },
        },
      ],

      default: [],
    },

    total_price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Define indexes properly - remove duplicate definitions
// For user_id: allow multiple nulls but only one non-null value
CartSchema.index(
  { user_id: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { user_id: { $exists: true, $ne: null } }
  }
);

// For session_id: allow multiple nulls but only one non-null value
CartSchema.index(
  { session_id: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { session_id: { $exists: true, $ne: null } }
  }
);

CartSchema.pre("save", function(next) {
  try {
    this.total_price = 0;

    if (this.products && this.products.length > 0) {
      this.products.forEach((store) => {
        store.store_subtotal = 0;

        store.products.forEach((prod) => {
          prod.subtotal_price = prod.price * prod.quantity;
          store.store_subtotal += prod.subtotal_price;
        });

        this.total_price += store.store_subtotal;
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

const cartModel = mongoose.model("cart", CartSchema);
module.exports = cartModel;