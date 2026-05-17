const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
      required: true,
    },

    for:{
        type:String,
        enum: ["resetPassword", "activateAccount"],
        required: true,
        default: null,
        index: true,
    },

    otpCode: {
      type: String,
      minlength: 6,
      maxlength: 6,
      index: true,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    otpExpiry: {
      type: Date,
      index: true,
      required: true,
      default: ()=> Date.now() + 1 * 60 * 1000, //1min
    },

    isVerified:{
      type: Boolean,
      default: false,
    },

    otpAttempts: {
      type: Number,
      min: 0,
      max: 3,
      default: 0,
      index: true,
    },

    // createdAt:{type:Date, default: Date.now, expires: "1m"} //TTL (time to live)
  },
  { timestamps: true, versionKey: false },
);

OTPSchema.index({ userId: 1, for:1}, {unique: true});

const otpModel = mongoose.model("otp", OTPSchema);
module.exports = otpModel;
