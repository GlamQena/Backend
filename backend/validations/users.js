const zod = require("zod");
const {usernameField, emailField, passwordField, phoneNumberField} = require("./auth");

const commonAddUserData = zod.object({
    username: usernameField,
    email: emailField,
    password: passwordField,
    phoneNumber: phoneNumberField,
});

const addStoreOwnerSchema = zod.object({
    store_name: z.string({required_error: "store name is required"}).trim().max(100, {message: "store name must be at most 100 characters"}),
    store_address: z.object({
            city: z.string().trim().max(50, { message: "city must be at most 50 characters" }).optional(),
            district: z.string().trim().max(50, { message: "district must be at most 50 characters" }).optional(),
            street: z.string().trim().max(100, { message: "street must be at most 100 characters" }).optional()
        }).optional(),
}).extend(commonAddUserData.shape);

const addAdminSchema = zod.object({
    permission: zod.array(zod.string().enum([
        "viewAnalytics",
        "manageUsers",
        "manageStores",
        "manageAdmins",
        "manageOrders",
        "manageCategories",
    ], {message: "invalid permission value"})).min(3, {message: "admin must have at least 3 permissions"}),
}).extend(commonAddUserData.shape);

const updateAdminPermissionsSchema = zod.object({
    permission: zod.array(
        zod.string().enum([
            "viewAnalytics",
            "manageUsers",
            "manageStores",
            "manageAdmins",
            "manageOrders",
            "manageCategories",
        ], { message: "invalid permission value" })
    ).min(3, { message: "admin must have at least 3 permissions" }),
});

module.exports = { addStoreOwnerSchema, addAdminSchema, updateAdminPermissionsSchema };