import mongoose from 'mongoose';

const TokenSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true,
    },

    for:{
        type:String,
        enum: ["resetPassword", "refreshToken", "accessToken"],
        required: true,
        default: null,
        index: true,
    },
    
    token:{
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    expiresAt:{
        type: Date,
        required: true,
        index: true,
    }

}, {timestamps: true, versionKey: false});

const tokenModel= mongoose.model("token", TokenSchema);
module.exports= tokenModel;