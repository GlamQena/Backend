const z = require("zod");
const {emailField} = require("./auth");

const billingSchema= z.object({
    first_name: z.string({required_error: "first_name field is required"}).trim().max(40, {message: `first_name must be at most 40 characters`}),
    last_name: z.string({required_error: "last_name field is required"}).trim().max(40, {message: `last_name must be at most 40 characters`}),
    email: emailField,
    phone_number: z.string({required_error: "phone_number field is required"}).trim().regex(/^01[0125]{1}[0-9]{8}$/, { 
        message: "invalid egyptian phone (must start with 012, 010, 011 or 015 then 8 digits)" 
    }),
    city: z.string({required_error: "city field is required"}).trim().max(50, { message: "city must be at most 50 characters" }),
    street: z.string({required_error: "street field is required"}).trim().max(100, { message: "street must be at most 100 characters" }),
    apartment: z.string({required_error: "apartment field is required"}).trim().max(10, { message: "apartment must be at most 50 characters" }),
    building: z.string({required_error: "building field is required"}).trim().max(10, { message: "building must be at most 50 characters" }),
    floor: z.string({required_error: "floor field is required"}).trim().max(10, { message: "floor must be at most 100 characters" }),
    country: z.string({required_error: "country field is required"}).trim().max(56, { message: "country must be at most 100 characters" }),
});

module.exports= {billingSchema};