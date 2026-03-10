const mongoose= require("mongoose");

const OTPSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        index: true,
        required: true,
    },

    for:{
        type:String,
        enum: ["verifyPhone", "resetPassword"],
        required: true,
        default: null,
        index: true,
    },

    otpCode:{
        type: String,
        minlength: 6,
        maxlength:6,
        index: true,
        required: true,
    },

    isVerfied:{
        type: Boolean,
        default: false,
    },

    otpExpiry:{
        type: Date,
        index: true,
        required: true,
        default: ()=> newDate(Date.now()+ 10+60+1000), //10 min
    },

    otpAttempts:{
        type: Number,
        min:0,
        max: 3, //per hour
        default:0,
        index: true,
    },

    firstAttemptAt: Date,

}, {timestamps: true, versionKey: false});

const otpModel= mongoose.model("otp", OTPSchema);
module.exports= otpModel;