const mongoose = require("mongoose");
const validator = require("validator");

const options = {
  timestamps: true,
  versionKey: false,
  discriminatorKey: "role",
};

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      minlength:3,
      maxlength: 64,
      lowercase: true,
      trim: true,
      index: true,
    },

    firstName: {
      type: String,
      trim: true,
      maxlength: 40,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 40,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 254,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: (v) => validator.isEmail(v), // /^[a-z0-9.%_+-]{3,}@[a-z0-9.-]+\.[a-z]{2,}$/.test(v)
        message: (props) => `${props.value} not valid email syntax!`,
      },
    },

    password: {
      type: String,
      trim: true,
      required: true,
      minlength: 8,
      maxlength: 64,
      select: false, //excluded by default when querying, for security.
    },

    role: {
      type: String,
      index: true,
      enum: ["user", "client", "store_owner", "admin"],
      default: "user",
    },

    phoneNumber: {
      type: String,
      // required: true,
      index: true,
      validate: {
        validator: (v) => validator.isMobilePhone(v, "ar-EG"), // /^01[0-2,5]{1}[0-9]{8}$/.test(v)
        message: (props) => `${props.value} not valid phone number!`,
      },
    },

    address: {
      type: {
        city: String,
        district: String, //منطقة
        street: String,
      },
    },

    birthdate: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    notifications: {
      type: [String],
      enum: ["email", "push", "sms"],
      default: ["email"],
      validate: {
        validator: (v) => v.length > 0,
        message: (props)=> "you must provide at least one notification preference!",
      },
    },
  },
  options,
);
//indexing the most used columns (username, phone, email, role) for performance and fast access.

UserSchema.virtual("age").get(function () {
  if (!this.birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - this.birthDate.getFullYear();

  const monthDiff = today.getMonth() - this.birthDate.getMonth();
  const dateDiff = today.getDate() - this.birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dateDiff < 0)) age--;

  return age;
}); //this function call fire each time the property accessed from the model

const userModel = mongoose.model("user", UserSchema);

module.exports = userModel;
