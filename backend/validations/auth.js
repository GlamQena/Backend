const z= require("zod");

const usernameOrEmailField= z.string({required_message: "usernameOrEmail is required"}).trim().toLowerCase().refine((data)=>data.includes("@")&&data.email({message:"invalid email format!"}));
const emailField= z.string({required_message: "email is required"}).trim().toLowerCase().max(254, {message: "email must be at most 254 characters"}).email({message: "invalid email format!"});
const usernameField= z.string({required_message: "username is required"}).trim().toLowerCase().max(64, {message: "username must be at most 64"});
const passwordField= z.string({required_message: "password is required"}).trim().min(8, {message:"password must be at least 8 characters"}).max(64, {message:"password must be at most 64 characters"});
const confirmPasswordField= z.string().nonempty({message: "confirm password mustn't be empty!"});

const loginSchema= x.object({usernameOrEmail: usernameOrEmailField, password: passwordField});
const registerSchema= z.object({
    username: usernameField, 
    email: emailField, 
    password: passwordField,
    confirmPassword: confirmPasswordField, //any other password validations handled by the refine method forcing it should match the restrictions imposed on password field.
    phone: z.string().trim().regex(/^01[1-2, 5]{1}[0-9]{8}$/, {message: "invalid egyptian phone (must start with 012, 010, 011 or 015 then 8 digits)"}).optional(),
    birthdate: z.date().optional(),
    gender: z.string().trim().toLowerCase().optional(),
    address: z.object({city: z.string().trim(), district: z.string().trim(), street:z.string().trim()}).optional(),
}).refine((data)=> data.password === data.confirmPassword, {message: "passwords must match!"});

const resetPasswordSchema= z.object({newPassword:passwordField, confirmPassword:confirmPasswordField})
.refine((data)=> data.newPassword === data.confirmPassword, {message: "passwords must match!"});

module.exports= {loginSchema, registerSchema, resetPasswordSchema};