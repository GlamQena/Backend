const zod = require("zod");

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