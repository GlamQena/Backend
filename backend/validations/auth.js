const z= require("zod");

const optionalSchemaHandler = (schema) =>
    z.preprocess((val) => {
        // Handle undefined, null, empty string, and empty objects

        if(val === undefined || val === null)
            return undefined;
        
        if (typeof val === "string" && val.trim() === "") {
            return undefined;
        }
        
        if (typeof val === "object" && val !== null && Object.keys(val).length === 0) {
            return undefined;
        }
        return val;
    }, schema.optional());

const optionalDateHandler = z.preprocess((val) => {
    if (!val || val === "") return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
}, z.date().optional());

const optionalEnumHandler = (enumValues) => z.preprocess((val) => {
    if (!val || val === "") return undefined;
    return val.toString().toLowerCase().trim();
}, z.enum(enumValues, { 
    message: `must be one of: ${enumValues.join(", ")}` 
}).optional());

const emailField= z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .email({ message: "invalid email format!" })
  .max(254, { message: "email must be at most 254 characters" });

const usernameField= z.string({required_error: "username is required"}).trim().toLowerCase().min(3, {message: "username must be at least 3 characters"}).max(64, {message: "username must be at most 64"}).regex(/^[a-z0-9_]{3,64}$/, {message: "username must have lowercase letters, numbers and underscores"});

const usernameOrEmailField= z.string({required_error: "usernameOrEmail is required"}).trim().toLowerCase()
.superRefine((data, ctx)=> {
    if(data.includes("@")){ //test as email
        const parsedEmail= emailField.safeParse(data);
        if(!parsedEmail.success)
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `email error: ${parsedEmail.error.issues[0].message}`,
                path: ["usernameOrEmail"],
            });
    }

    else{
        const parsedUsername= usernameField.safeParse(data);
        if(!parsedUsername.success)
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `username error: ${parsedUsername.error.issues[0].message}`,
                path: ["usernameOrEmail"],
            });
    }
});

const passwordField= z.string({required_error: "password is required"}).trim()
    .min(8, {message:"password must be at least 8 characters"})
    .max(64, {message:"password must be at most 64 characters"})
    .regex(/[A-Z]/, {message: "password must contain at least one uppercase character"})
    .regex(/[a-z]/, {message: "password must contain at least one lowercase character"})
    .regex(/[0-9]/, {message: "password must contain at least one digit"});

const confirmPasswordField= z.string().nonempty({message: "confirm password mustn't be empty!"});

const phoneNumberField= optionalSchemaHandler(
        z.string().trim().regex(/^01[0125]{1}[0-9]{8}$/, { 
            message: "invalid egyptian phone (must start with 012, 010, 011 or 015 then 8 digits)" 
        })
    );

const commonOptionalFields = z.object({
    address: optionalSchemaHandler(
        z.object({
            city: z.string().trim().max(50, { message: "city must be at most 50 characters" }).optional().default(""),
            district: z.string().trim().max(50, { message: "district must be at most 50 characters" }).optional().default(""),
            street: z.string().trim().max(100, { message: "street must be at most 100 characters" }).optional().default("")
        })
    ),
    phoneNumber: phoneNumberField,
    birthdate: optionalDateHandler,
    gender: optionalEnumHandler(["male", "female"]),
});

const loginSchema= z.object({usernameOrEmail: usernameOrEmailField, password: passwordField});

const registerSchema= z.object({
    username: usernameField, 
    email: emailField, 
    password: passwordField,
    confirmPassword: confirmPasswordField, //any other password validations handled by the refine method forcing it should match the restrictions imposed on password field.
    role: z.enum(["client", "store_owner"], {
      required_error: "role is required",
      message: "role must be either client or store_owner"
    }),
})
.extend(commonOptionalFields.shape)
.refine(
    (data)=> data.password === data.confirmPassword, 
    {
    message: "passwords must match!",  
    path: ["confirmPassword"] // This highlights the confirmPassword field in errors
    }
);

const storeOwnerSpecificRegister= z.object({
    store_name: z.string({required_error: "store name is required"}).trim().max(100, {message: "store name must be at most 100 characters"}),
    store_email: z.string({required_error: "email is required" }).trim().toLowerCase().email({message: "store email is invalid"}),
    store_phone: z.string({required_error: "store phone is required!"}).trim().regex(/^01[0125][0-9]{8}$/, {message: "invalid egyptian phone"}),
    store_address: z.object({
        city: z.string({ required_error: "city is required" }).trim().max(50, { message: "city must be at most 50 characters" }),
        district: z.string({ required_error: "district is required" }).trim().max(50, { message: "district must be at most 50 characters" }),
        street: z.string({ required_error: "street is required" }).trim().max(100, { message: "street must be at most 100 characters" })
    }, {required_error: "store address is required!"}),
});

const newConfirmPasswords= z.object({newPassword:passwordField, confirmNewPassword:confirmPasswordField})
.refine((data)=> data.newPassword === data.confirmNewPassword, {message: "new password and its confirm must match!", path: ["confirmPassword"]});

const resetPasswordSchema= newConfirmPasswords;
const changePasswordSchema= z.object({currentPassword: passwordField})
.extend(newConfirmPasswords.shape);

module.exports= {loginSchema, registerSchema, resetPasswordSchema, changePasswordSchema, storeOwnerSpecificRegister, usernameField, emailField, passwordField, phoneNumberField, commonOptionalFields, optionalSchemaHandler, optionalEnumHandler};