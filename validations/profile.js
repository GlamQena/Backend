const {emailField, commonOptionalFields, optionalSchemaHandler, optionalEnumHandler, storeOwnerSpecificRegister}= require("./auth.js");
const zod = require("zod");

const nameField= (name)=> zod.string().trim().max(40, {message: `${name} must be at most 40 characters`}).optional().nullable();

const optionalEnumArrayHandler= (enumValues, maxItems=null)=>{
    let schema= zod.array(zod.enum(enumValues, {message: `must be one of [${enumValues.join(", ")}]`}));

    if(maxItems)
        schema.max(maxItems, {message: `can't select more than ${maxItems} options`});

    return schema.optional();
}

const commonProfileFields= zod.object({
    email: emailField,
    firstName: optionalSchemaHandler(nameField("firstName")),
    lastName: optionalSchemaHandler(nameField("lastName")),
    notifications: zod.array(optionalEnumHandler(["email", "push", "sms"])).min(1, {message: "you must provide at least one notification preference"}).default(["email"]),
}).extend(commonOptionalFields.shape);

const clientProfile= zod.object({
    skinType: optionalSchemaHandler(zod.enum(['جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية'], {message: "Skin type must be oily, dry, combination, sensitive, or normal"})).default("normal"),
    skinConcerns: zod.preprocess((val)=>{
        if(!val || (Array.isArray(val) && val.length===0)) 
            return undefined
        return val
    }, 
    optionalEnumArrayHandler(['حب الشباب', 'تجاعيد', 'جفاف', 'تصبغات', 'هالات سوداء'], 3).default([])
    ),

}).extend(commonProfileFields.shape);

const storeOwnerProfile= zod.object({
    storeDescription: optionalSchemaHandler(zod.string().trim()),
    bankAccount: optionalSchemaHandler(zod.object({
        accountName: zod.string().trim().optional(),
        accountNumber: zod.string().trim().regex(/^[0-9]{10,20}$/, {message: "invalid account number format!"}).optional(),
        bankName: optionalEnumHandler(["البنك الأهلي المصري", "بنك مصر", "بنك القاهرة", "البنك الزراعي المصري",]),
    }))
})
.extend(commonProfileFields.shape)
.extend(storeOwnerSpecificRegister.shape);

const adminProfile= zod.object({
    
}).extend(commonProfileFields.shape);

module.exports= {clientProfile, storeOwnerProfile, adminProfile};