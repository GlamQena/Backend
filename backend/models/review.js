import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "client",
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
  },
  store_owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shop_owner",
  },
  userDetails: {
    type: {
      skinType: {
        type: String,
        enum: {
          values: ["oily", "dry", "combination", "sensitive", "normal"],
        },
        default: "normal",
        trim: true,
        lowercase: true,
      },
      skinConcerns: {
        type: [String],
        enum: [
          "acne",
          "aging",
          "dryness",
          "redness",
          "dark_circles",
          "oiliness",
          "blackheads",
          "whiteheads",
          "uneven_texture",
        ],
        validate: {
          validator: function (concerns) {
            return concerns.length <= 5;
          },
          error: "can't choose more than 5 skin concerns!",
        },
      },
    },
  },
  rating:{
    type:Number,
    min:0,
    max:5
  },
  comment:{
    type:String
  },
  images :{type:[URL]},
  replies:{
type:{
  user_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  user_role:{
      type: String,
      index: true,
      enum: ["user", "client", "shop_owner", "admin"],
      default: "user",
  },
  comment:{
    type:String
  },
  createdAt:{
    type:Date
  }
}
  },isApproved:{
    type:Boolean
  },
  isActive:{type:Boolean}
},{timestamps: true,});


const reviewModel = mongoose.model("review",ReviewSchema)

export default reviewModel