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
      "manageUsers", //clients
      "manageAdmins",
      "viewAnalytics",
      "manageStores",
      "manageOrders",
      "manageCategories",
    ],
    validate: {
      validator: (v) => {
        return v.length >= 3;
      },
      message: (props)=> "the admin must have at least 3 permissions!",
    },
    default: [
      "viewAnalytics",
      "manageUsers",
      "manageCategories",
    ],
  },

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

const adminModel = userModel.discriminator("admin", AdminSchema); //discriminator key value must match role enum values.
module.exports = { userModel, adminModel };
