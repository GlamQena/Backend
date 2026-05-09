const zod = require("zod");

const categorySchema=zod.object({
    name: zod.string().trim().pipe(zod.enum(["العناية بالبشرة", "المكياج", "الأدوات", "العناية بالجسم", "العناية بالشعر", "العناية بالرجال", "أخرى"], {message: "invalid category name"})),
    description: zod.string().trim().max(500, "category description mustn't exceed 500 characters"),
    totalProducts: zod.number().optional().default(0),
    isActive: zod.boolean().default(true),
}); //for add, edit category

//TODO => productSchema  //for add, edit product
module.exports= {categorySchema};