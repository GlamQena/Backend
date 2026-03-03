import userModel from './user.js';

const ShopOwnerSchema= new mongoose.Schema({
    businessName:{
        type: String,
        trim: true,
        maxlength:100,
        required: true,
        index: true,
    },

    businessPhone:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
        validate:{
            validator: (v)=> validator.isMobilePhone(v, 'ar-EG'),
            message: (props)=> `${props.value} isn't a valid phone number!`,
        }
    },

    businessEmail: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: props => `${props.value} is not a valid email!`
        }
    },

    bankAccount:{
        accountName: {
            type:String,
            required: true,
        },
        accountNumber: {
            type: String,
            trim: true,
            required:true,
            validate:{
                validator: (v)=> !v|| /^[0-9]{10,20}$/.test(v),
                message: (props)=> `${props.value} not valid banck account number!`,
            }
        },
        bankName:{
            type: String,
            enum:[
            "National Bank of Egypt (NBE)",
            "Banque Misr",
            "Banque du Caire",
            "Agricultural Bank of Egypt",
            "Credit Agricole Egypt"
            ],
            required: true,
        }
    },

    storesInCommon:{
        type:[
            {
                storeId:{
                    type:mongoose.Types.ObjectId,
                    ref: "store",
                },
                storeName: {
                    type:String,
                    required: true,
                    trim: true,
                },
                joinedAt:{
                    type: Date,
                    default: new Date,
                },
                isActive:{
                    type: Boolean,
                    default: true,
                }
            }
        ]
    } // list of stores he own and our platform support
})

const shopOwnerModel= userModel.discriminator("shop_owner", ShopOwnerSchema);
module.exports= {userModel, shopOwnerModel};