import mongoose from 'mongoose';

const options={
    timestamps: true,
    versionKey: false,
    discriminatorKey: "role",
}

const UserSchema= new mongoose.Schema({
    role:{type: String, enum: ["user", "client", "delivery_worker", "shop_owner", "admin"], default:"user"},
    //TODO other properties
}, options);

export const userModel= mongoose.model('user', UserSchema);