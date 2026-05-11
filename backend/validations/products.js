const zod = require("zod");
<<<<<<< HEAD

const categorySchema=zod.object({
    name: zod.string().trim().pipe(zod.enum(["Cleansers",
        "Moisturizers",
        "Serums",
        "Sun Care",
        "Masks",
        "Toners",
        "Concealer",
        "Foundation",
        "Lipstick",
        "Blusher",
        "Eyeshadow",
        "Mascara",
        "Eyeliner",
        "Brushes",
        "Others"], {message: "invalid category name"})),
    description: zod.string().trim().max(500, "category description mustn't exceed 500 characters"),
    isActive: zod.boolean().default(true),
});

//TODO => productSchema
module.exports= {categorySchema};
=======
const { optionalEnumHandler } = require("./auth");

const categoryEnum= ["العناية بالبشرة", "المكياج", "الأدوات", "العناية بالجسم", "العناية بالشعر", "العناية بالرجال", "أخرى"];
const categorySchema=zod.object({
    name: zod.string().trim().pipe(zod.enum(categoryEnum, {message: `category name must be one of ${categoryEnum.join(", ")}`})),
    description: zod.string().trim().max(500, "category description mustn't exceed 500 characters"),
    totalProducts: zod.number().optional().default(0),
    isActive: zod.boolean().default(true),
});

const skinTypeEnum= ['جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية'];
const productSchema = zod.object({
    name: zod.string({required_error: "product name is required"}).trim()
    .min(3, { message: "product name must be at least 3 characters" })
    .max(100, { message: "product name must not exceed 100 characters" }),
    description: zod.string().trim()
    .max(600, {message: "product description must not exceed 600 characters"})
    .optional(),
    price: zod.number({required_error: "product price is required"})
    .min(0, {message: "Price cannot be negative"})
    .max(9999.99, { message: "Price must not exceed 9999.99" }),
    stock: zod.number({required_error: "product quantity in stock is required"})
    .min(0, {message: "Stock cannot be negative"})
    .max(10000, { message: "Stock must not exceed 10000 units" }),
    ingredients: zod.array(
    zod.string().trim()
    .min(3, {message: "ingrediant name must be at least three characters"})
    .max(100, { message: "ingredient name must not exceed 100 characters" }))
    .optional().default([])
    .refine(val => val.length<=30, {message: "ingrediants mustn't exceed 30"}),
    images: zod.array(zod.string().trim())
    .min(1, {message: "you must provide at least one image"})
    .max(7, {message: "you can't add more than 7 images"}),
    weight: zod.number()
    .min(0, {message: "weight cannot be negative"})
    .max(5, {message: "weight cannot exceed 5 KG"})
    .optional().default(0.2), //optional().default() methods must be at last as they return a type that hasn't .min().max() methods
    dimensions: zod.object({
        length: zod.number()
        .min(1, {message: "please provide a valid length value"})
        .max(100, {message: "the product length mustn't exceed 100 units"}).optional().default(15),
        width: zod.number()
        .min(1, {message: "please provide a valid width value"})
        .max(100, {message: "the product width mustn't exceed 100 units"}).optional().default(10),
        height: zod.number()
        .min(1, {message: "please provide a valid height value"})
        .max(100, {message: "the product height mustn't exceed 100 units"}).optional().default(5),
    })
    .optional()
    .default({
        length: 15,
        width: 10,
        height: 5
    }),
    skinType: optionalEnumHandler(skinTypeEnum).default("عادية"),
});

module.exports= {categorySchema, productSchema};
>>>>>>> origin/main
