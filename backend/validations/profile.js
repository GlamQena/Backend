const {emailField, commonOptionalFields, optionalSchemaHandler, storeOwnerSpecificRegister}= require("./auth.js");
const zod = require("zod");

const nameField= (name)=> zod.string().trim().max(40, {message: `${name} must be at most 40 characters`}).optional().nullable();

const commonProfileFields= zod.object({
    email: emailField,
    firstName: optionalSchemaHandler(nameField("firstName")),
    lastName: optionalSchemaHandler(nameField("lastName")),
    notifications: zod.array(zod.enum(["email", "push", "sms"], {message:"notification available options [email, sms, push]"})).min(1, {message: "you must provide at least one notification preference"}).default(["email"]),
}).extend(commonOptionalFields.shape);

const clientProfile= zod.object({
    skinType: optionalSchemaHandler(zod.enum(["oily", "dry", "combination", "sensitive", "normal"], {message: "Skin type must be oily, dry, combination, sensitive, or normal"}).optional().default("normal")),
    skinConcerns: zod.preprocess((val)=>{
        if(!val || (Array.isArray(val) && val.length===0)) 
            return undefined
        return val
    }, 
    zod.array(zod.enum(["acne", "aging", "dryness", "redness", "dark_circles", "oiliness", "blackheads", "whiteheads",], {message: "inavailable skin concern!"})).max(5, {message: "can't select more than 5 skin concerns!"}).optional().default([])
    ),

}).extend(commonProfileFields.shape);

const storeOwnerProfile= zod.object({
    storeDescription: optionalSchemaHandler(zod.string().trim().optional()),
    bankAccount: zod.object({
        accountName: zod.string().trim().optional(),
        accountNumber: zod.string().trim().regex(/^[0-9]{10,20}$/, {message: "invalid account number format!"}).optional(),
        bankName: zod.preprocess((val)=>{
            if(!val || (typeof val=="string" && val.trim()==""))
                return undefined
            return val.trim()
        },
        zod.enum(["البنك الأهلي المصري", "بنك مصر", "بنك القاهرة", "البنك الزراعي المصري",], {message:"unsupported bank!"}).optional()
        ),
    }).optional()
})
.extend(commonProfileFields.shape)
.extend(storeOwnerSpecificRegister.shape);

const adminProfile= zod.object({

}).extend(commonProfileFields.shape);

module.exports= {clientProfile, storeOwnerProfile, adminProfile};