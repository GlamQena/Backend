const mongoose = require("mongoose");
const Category = require("../models/category"); 
const fs= require("fs");
require("dotenv").config();

let categories = [
  {
    _id: "69e387b312d268b6bb3b69db",
    name: "العناية بالبشرة",
    icon: "🧴",
    description: "منتجات لتنظيف وترطيب وعلاج وحماية بشرتك. تشمل المنظفات والسيرومات والمرطبات وواقيات الشمس والأقنعة.",
    isActive: true,
    categoryKey: "skincare"
  },
  {
    _id: "69e387b312d268b6bb3b69dc",
    name: "المكياج",
    icon: "💄",
    description: "مستحضرات تجميل لتعزيز الجمال تشمل كريم الأساس وأحمر الشفاه والماسكارا وظلال العيون والبلاش والكونسيلر والكحل.",
    isActive: true,
    categoryKey: "makeup"
  },
  {
    _id: "69e387b312d268b6bb3b69dd",
    name: "الأدوات",
    icon: "🪞",
    description: "فرش، إسفنج، مكواة تجعيد، ملاقط وإكسسوارات أخرى لتطبيق لا تشوبه شائبة للمكياج والعناية بالبشرة.",
    isActive: true,
    categoryKey: "tools"
  },
  {
    _id: "69e387b312d268b6bb3b69de",
    name: "العناية بالجسم",
    icon: "🧼",
    description: "لوشن، مقشرات، زيوت، جل استحمام وكريمات يد لتغذية والعناية ببشرة جسمك.",
    isActive: true,
    categoryKey: "bodycare"
  },
  {
    _id: "69e387b312d268b6bb3b69df",
    name: "العناية بالشعر",
    icon: "💇‍♀️",
    description: "شامبو، بلسم، أقنعة شعر، سيرومات وعلاجات لشعر صحي وجميل.",
    isActive: true,
    categoryKey: "haircare"
  },
  {
    _id: "69e387b312d268b6bb3b69e0",
    name: "العناية بالرجال",
    icon: "🧔‍♂️",
    description: "ماكينات حلاقة، كريمات حلاقة، زيوت لحية، مزيلات عرق ومنتجات للعناية بالبشرة مصممة للرجال.",
    isActive: true,
    categoryKey: "mens_grooming"
  },
  {
    _id: "69e387b312d268b6bb3b69e1",
    name: "أخرى",
    icon: "📦",
    description: "حقائب مكياج، مرايا، طقم هدايا، إكسسوارات تنظيف ومنتجات أخرى متعلقة بالجمال.",
    isActive: true,
    categoryKey: "other"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");
    
    await Category.deleteMany({});
    console.log("Cleared existing categories");
     
    // categories= JSON.parse(fs.readFileSync("./sources/categories.json", "utf-8"));
    fs.writeFileSync("./sources/categories.json", JSON.stringify(categories), "utf-8");
    console.log("Categories saved to sources/categories.json");

    const insertedCategories = await Category.insertMany(categories);
    console.log(`Seeded ${insertedCategories.length} categories`);
    process.exit(); 
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

seedDB();