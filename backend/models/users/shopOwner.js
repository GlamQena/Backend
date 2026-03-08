const mongoose= require("mongoose");
const userModel= require("./user.js");

const ShopOwnerSchema = new mongoose.Schema({
  storeName: {
    type: String,
    trim: true,
    maxlength: 100,
    required: true,
    index: true,
  },

  businessPhone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    validate: {
      validator: (v) => validator.isMobilePhone(v, "ar-EG"),
      message: (props) => `${props.value} isn't a valid phone number!`,
    },
  },

  businessEmail: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: (props) => `${props.value} is not a valid email!`,
    },
  },

  bankAccount: {
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: (v) => !v || /^[0-9]{10,20}$/.test(v),
        message: (props) => `${props.value} not valid banck account number!`,
      },
    },
    bankName: {
      type: String,
      enum: [
        "National Bank of Egypt (NBE)",
        "Banque Misr",
        "Banque du Caire",
        "Agricultural Bank of Egypt",
      ],
      required: true,
    },
  },

  store_description: {
    type: String,
  },

  store_address: {
    city: {
      type: String,
    },
    street: {
      type: String,
    },
  },

  total_products: {
    type: Number,
  },

  total_orders: {
    type: Number,
  },

  total_revenue: {
    type: Number,
  }, //from the platform

  average_rating: {
    type: Number,
    min: 0,
    max: 5,
  },

  total_rates: {
    type: Number,
  },

  is_approved: {
    type: Boolean,
  }, //by the admin

  social_links: {
    type: [
      {
        platform_name: {
          type: String,
          enum: ["facebook", "youTube", "instagram", "tiktok", "x", "linkedin"],
        },
        page_url: {
          type: URL,
        },
      },
    ],
  },

  interactive_clients:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
    }
  ]
});

const shopOwnerModel = userModel.discriminator("shop_owner", ShopOwnerSchema);

module.exports = { userModel, shopOwnerModel };
