const userModel = require("./user.js");
const mongoose = require("mongoose");
const validator = require("validator");

const AdminSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "admin",
    required: true,
  },

  lastActivity: {
    type: Date,
  },

  permission: {
    type: [String],
    enum: [
      "manageUsers",
      "manageAdmins",
      "viewAnalytics",
      "manageStores",
      "manageProducts",
      "manageOrders",
      "manageCategories",
    ],
    validate: {
      validator: (v) => {
        return v.length >= 5;
      },
      message: (props)=> "the admin must have at least 5 permissions!",
    },
    default: [
      "manageUsers",
      "manageStores",
      "manageProducts",
      "manageOrders",
      "manageCategories",
    ],
  },

  orders_management:{
    dailyOrders: Number,
    dailyRevenue: Number,
    pendingShipments: Number,    // From Bosta webhooks
    failedDeliveries: Number,
    lastSyncWithBosta: Date
  }
});

const adminModel = userModel.discriminator("admin", AdminSchema); //discriminator key value must match role enum values.
module.exports = { userModel, adminModel };
