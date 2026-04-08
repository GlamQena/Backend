const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
      unique: true,
      index: true,
      required:false
    },

    session_id: {
      type: String,
      unique: true,
      index: true,
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
  },
);

CartSchema.pre("save", function(next) {
  try {
    this.total_price = 0;

    // Fixed: Added 'this.' before products
    if (this.products && this.products.length > 0) {
      // Fixed: Proper arrow function syntax
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