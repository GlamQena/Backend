const userModel = require("./user.js");
const mongoose = require("mongoose");
const validator = require("validator");

const AdminSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "admin",
    default: null,
  },

  permission: {
    type: [String],
    enum: [
      "viewAnalytics",
      "manageUsers", //clients
      "manageOrders",
      // "manageProducts",
      "manageCategories",
      "manageStores",
      "manageAdmins"
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
      "manageOrders",
    ],
  },

  deletion_requested:{
    type: Boolean,
    default: false,
  },

  deletion_status:{
    type:String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  totalOperations:{
    type: Number,
    default: 0,
  },

  lastActivity: {
    type: Date,
    default: null,
  }
});

// Safety net for the super admin (createdBy === null).
// This is independent from the hierarchy rules in updateAdminPermissions —
// that controller decides who is allowed to edit whose permissions,
// while this hook guarantees the super admin's own permission list is
// never left incomplete (e.g. missing "manageAdmins"), no matter how or
// where the document gets saved (initial seed, a future admin panel,
// a manual fix in the DB, etc.). Without this, the super admin could get
// locked out of admin-only endpoints by a simple data mistake.
const ALL_PERMISSIONS = [
  "viewAnalytics",
  "manageUsers",
  "manageOrders",
  "manageCategories",
  "manageStores",
  "manageAdmins",
];

// Runs on every save() of an admin document; forces full permissions
// whenever the document being saved is the super admin.
AdminSchema.pre("save", function (next) {
  if (this.createdBy === null) {
    this.permission = ALL_PERMISSIONS;
  }
  next();
});

const adminModel = userModel.discriminator("admin", AdminSchema); //discriminator key value must match role enum values.
module.exports = { userModel, adminModel };
