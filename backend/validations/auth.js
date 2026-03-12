const z= require("zod");

const optionalSchemaHandler= (schema)=>
    z.preprocess((val)=> {
        if(val==undefined || val==null || val=="")
            return undefined;
        return val;
    }, schema);

const emailField= z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .email({ message: "invalid email format!" })
  .max(254, { message: "email must be at most 254 characters" });
const usernameField= z.string({required_error: "username is required"}).trim().toLowerCase().min(3, {message: "username must be at least 3 characters"}).max(64, {message: "username must be at most 64"}).regex(/^[a-z0-9_]{3,64}$/, {message: "username must have lowercase letters, numbers and underscores"});
const usernameOrEmailField= z.string({required_error: "usernameOrEmail is required"}).trim().toLowerCase()
.refine((data)=> {
    if(data.includes("@")){ //test as email
        try{
            emailField.parse(data); 
            return true;
        }catch(err){
            return false;
        }
    }
    return /^[a-z0-9_]{3,64}$/.test(data); //test as username
});
const passwordField= z.string({required_error: "password is required"}).trim()
.min(8, {message:"password must be at least 8 characters"})
.max(64, {message:"password must be at most 64 characters"})
.regex(/[A-Z]/, {message: "password must contain at least one uppercase character"})
.regex(/[a-z]/, {message: "password must contain at least one lowercase character"})
.regex(/[0-9]/, {message: "password must contain at least one digit"});
const confirmPasswordField= z.string().nonempty({message: "confirm password mustn't be empty!"});

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
    phone: optionalSchemaHandler(z.string().trim().regex(/^01[0125]{1}[0-9]{8}$/, {message: "invalid egyptian phone (must start with 012, 010, 011 or 015 then 8 digits)"}).optional().nullable()),
    birthdate: z.preprocess((val) => {
        if (!val || val === "" || val === null || val === undefined) return undefined;
        const date = new Date(val);
        if (isNaN(date.getTime())) {
            return undefined;
        }
        return date;
    },
      z.date().nullable().optional()
    ),
    gender: z.preprocess(
        (val) => {
            if (!val || val === "" || val === null || val === undefined) return undefined;
            return val.toLowerCase().trim();
        },
        z.enum(["male", "female"], { 
            message: "gender must be male or female" 
        }).optional()
    ),
    address: optionalSchemaHandler(z.object({
        city: z.string().trim().min(1, {message: "city is required"}),
        district: z.string().trim().min(1, {message: "district is required"}), 
        street:z.string().trim().min(1, {message: "street is required"})
    }).optional().nullable()),
})
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
        city: z.string().trim().min(1, {message: "city is required"}),
        district: z.string().trim().min(1, {message: "district is required"}), 
        street:z.string().trim().min(1, {message: "street is required"})
    }),
});

const resetPasswordSchema= z.object({newPassword:passwordField, confirmPassword:confirmPasswordField})
.refine((data)=> data.newPassword === data.confirmPassword, {message: "new password and its confirm must match!", path: ["confirmPassword"]});

module.exports= {loginSchema, registerSchema, resetPasswordSchema, storeOwnerSpecificRegister};