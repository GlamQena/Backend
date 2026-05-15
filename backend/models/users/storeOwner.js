const mongoose = require("mongoose");
const userModel = require("./user.js");
const validator= require("validator")

const storeOwnerSchema = new mongoose.Schema({
  store_name: {
    type: String,
    trim: true,
    maxlength: 100,
    required: true,
    index: true,
  },

  store_phone: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    index: true,
    validate: {
      validator: (v) => validator.isMobilePhone(v, "ar-EG"),
      message: (props) => `${props.value} isn't a valid phone number!`,
    },
  },

  store_email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v)=> validator.isEmail(v),
      message: (props) => `${props.value} is not a valid email!`,
    },
  },

  isStoreEmailVerified: {
    type: Boolean,
    default: false,
  },

  store_address: {
    type:{
      city: {
        type: String,
        required: true,
      },

      district: {
        type: String,
        required: true,
      },

      street: {
        type: String,
        required: true,
      },
    },
    required: false,
  },

  store_description: {
    type: String,
  },

  bankAccount: {
    accountName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^[0-9]{10,20}$/.test(v),
        message: (props) => `${props.value} not valid banck account number!`,
      },
    },
    bankName: {
      type: String,
      enum: [
        "البنك الأهلي المصري",
        "بنك مصر",
        "بنك القاهرة",
        "البنك الزراعي المصري",
      ],
    },
  }, //for later payout 

  total_products: {
    type: Number,
    default: 0,
  },

  total_orders: {
    type: Number,
    default: 0,
  },

  average_rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },

  total_rates: {
    type: Number,
    default: 0,
  },

  is_approved: {
    type: Boolean,
    default: false,
  }, //by the admin for the registeration request

  deletion_requested:{
    type: Boolean,
    default: "false",
  },

  deletion_status:{
    type:String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  }
});

const storeOwnerModel = userModel.discriminator(
  "store_owner",
  storeOwnerSchema,
);

module.exports = { userModel, storeOwnerModel };
