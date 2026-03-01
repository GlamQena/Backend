import mongoose from 'mongoose';

const TokenSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true,
    },

    refreshToken: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "token",
        required: true,
        index: true,
    },

    userRole:{
        type: String,
        enum: ["user", "client", "delivery_worker", "shop_owner", "admin"],
        required: true,
        index: true,
    }, // set for direct access for refreshing access-token

    device_info: {
        displayName:String,

        device_type:{
            type: String,
            enum:["mobile", "tablet", "desktop"],
        },

        browser: String,
        os: String,
        ip: String,
    },

    status: {
        type: String,
        enum: ["active", "idle", "closed"],
    },

    closing_Reason:{
        type: String,
        enum: ["user_logout", "window_close", "session_expired", "revoke",  "admin_terminated"],
    },

    isActive:{
        type: Boolean,
        default: true,
    },

    lastActiveAt:Date,

    expiresAt:{
        type: Date,
        required: true,
        index: true,
    }

}, {timestamps: true, versionKey: false});

export const tokenModel= mongoose.model("token", TokenSchema);