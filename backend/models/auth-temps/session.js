const mongoose= require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    access_token_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "token",
    },
    refresh_token_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "token",
      required: true,
      index: true,
    },

    userRole: {
      type: String,
      enum: ["user", "client", "shop_owner", "admin"],
      required: true,
      index: true,
    }, // set for direct access for refreshing access-token

    device_info: {
      displayName: String,

      device_type: {
        type: String,
        enum: ["mobile", "tablet", "desktop"],
      },

      browser: String,
      os: String,
      ip: String,
    },

    status: {
      type: String,
      enum: ["active", "idle", "closed"],
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },

    lastActiveAt: Date,

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const sessionModel = mongoose.model("session", SessionSchema);

module.exports = sessionModel;
