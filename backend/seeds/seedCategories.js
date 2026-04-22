const mongoose = require("mongoose");
const Category = require("../models/category"); 
const fs= require("fs");
require("dotenv").config();

// let categories = [
//   // --- Skin Care ---
//   { name: "Cleansers", description: "Formulated to remove impurities while maintaining skin balance." },
//   { name: "Moisturizers", description: "Hydrating products to lock in moisture and protect the skin barrier." },
//   { name: "Serums", description: "Concentrated formulas to target specific skin concerns." },
//   { name: "Sun Care", description: "Essential UV protection to prevent sun damage." },
//   { name: "Masks", description: "Intensive treatments for deep hydration and skin repair." },
//   { name: "Toners", description: "Refreshing liquids to refine pores and prep the skin." },
  
//   // --- Makeup  ---
//   { name: "Concealer", description: "Used to mask dark circles, age spots, and other small blemishes." },
//   { name: "Foundation", description: "Skin-colored makeup applied to the face to create an even, uniform color." },
//   { name: "Lipstick", description: "Color, texture, and protection to the lips in various finishes." },
//   { name: "Blusher", description: "Applied to the cheeks to provide a more youthful and radiant appearance." },
//   { name: "Eyeshadow", description: "Pigmented powders or creams applied to the eyelids to make them stand out." },
//   { name: "Mascara", description: "Used to enhance the upper and lower eyelashes for a thicker look." },
//   { name: "Eyeliner", description: "Used to define the eyes and create various artistic looks." },
//   { name: "Brushes", description: "Essential tools for the precise application of various makeup products." }
// ];

let categories = [
  {
    _id: "69e387b312d268b6bb3b69db",
    name: "العناية بالبشرة",
    icon: "🧴",
    description: "Products for cleansing, moisturizing, treating, and protecting your skin. Includes cleansers, serums, moisturizers, sunscreens, and masks.",
    isActive: true
  },
  {
    _id: "69e387b312d268b6bb3b69dc",
    name: "المكياج",
    icon: "💄",
    description: "Cosmetics for enhancing beauty including foundation, lipstick, mascara, eyeshadow, blush, concealer, and eyeliner.",
    isActive: true
  },
  {
    _id: "69e387b312d268b6bb3b69dd",
    name: "الأدوات",
    icon: "🪞",
    description: "Brushes, sponges, curlers, tweezers, and other accessories for flawless makeup and skincare application.",
    isActive: true
  },
  {
    _id: "69e387b312d268b6bb3b69de",
    name: "العناية بالجسم",
    icon: "🧼",
    description: "Lotions, scrubs, oils, shower gels, and hand creams for nourishing and caring for your body skin.",
    isActive: true
  },
  {
    _id: "69e387b312d268b6bb3b69df",
    name: "العناية بالشعر",
    icon: "💇‍♀️",
    description: "Shampoos, conditioners, hair masks, serums, and treatments for healthy, beautiful hair.",
    isActive: true
  },
  {
    _id: "69e387b312d268b6bb3b69e0",
    name: "العناية بالرجال",
    icon: "🧔‍♂️",
    description: "Razors, shaving creams, beard oils, deodorants, and skincare products designed for men.",
    isActive: true
  },
  {
    _id: "69e387b312d268b6bb3b69e1",
    name: "أخرى",
    icon: "📦",
    description: "Makeup bags, mirrors, gift sets, cleansing accessories, and other beauty-related products.",
    isActive: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");
    
    await Category.deleteMany({});
    fs.writeFileSync("./sources/categories.json", JSON.stringify(categories), "utf-8");
    categories= JSON.parse(fs.readFileSync("./sources/categories.json", "utf-8"));
    await Category.insertMany(categories);
    
    console.log("Categories seeded successfully");
    process.exit(); 
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

seedDB();