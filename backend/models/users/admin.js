const userModel = require("./user.js");
const mongoose = require("mongoose");
const validator = require("validator");

const AdminSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "admin",
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
      "manageDelivery",
    ],
    validate: {
      validator: (v) => {
        return v.length >= 5;
      },
      message: "the admin must have at least 5 permissions!",
    },
    default: [
      "manageUsers",
      "manageStores",
      "manageProducts",
      "manageOrders",
      "manageCategories",
    ],
  },
});

const adminModel = userModel.discriminator("admin", AdminSchema); //discriminator key value must match role enum values.
module.exports = { userModel, adminModel };
