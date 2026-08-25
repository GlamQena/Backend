const mongoose = require("mongoose");
const Category = require("../models/category"); 
const fs= require("fs");
require("dotenv").config();

let categories = [
  {
    _id: "69e387b312d268b6bb3b69db",
    name: "العناية بالبشرة",
    icon: "🧴",
    description: "منتجات العناية بالبشرة المصممة لتلبية احتياجاتك اليومية، تشمل غسولات لطيفة ومنظفات عميقة، تونرات منعشة، سيرومات مركزة بفيتامين سي والنياسيناميد، وكريمات مرطبة بحمض الهيالورونيك والسيراميدات. تناسب جميع أنواع البشرة—جافة، دهنية، مختلطة، وحساسة—لتحقيق بشرة صافية، نضرة، وخالية من العيوب.",
    isActive: true,
    categoryKey: "skincare"
  },
  {
    _id: "69e387b312d268b6bb3b69dc",
    name: "المكياج",
    icon: "💄",
    description: "مستحضرات تجميل احترافية لتعزيز جمالك وإبراز ملامحك. تشمل كريم الأساس، أحمر الشفاه، الماسكارا، ظلال العيون، البلاش، الكونسيلر، الكحل، وأدوات التحديد. تركيبات عالية الجودة تدوم طويلاً وتمنحك إطلالة متألقة تناسب جميع المناسبات.",
    isActive: true,
    categoryKey: "makeup"
  },
  {
    _id: "69e387b312d268b6bb3b69dd",
    name: "الإكسسوارات",
    icon: "💍",
    description: "أدوات احترافية وإكسسوارات أساسية لتطبيق مكياج وعناية لا تشوبه شائبة. تشمل فرش التجميل، إسفنجات المكياج، مكواة تجعيد الشعر، ملاقط الحواجب، ومجموعات العناية المتكاملة لروتين جمالي مثالي.",
    isActive: true,
    categoryKey: "tools"
  },
  {
    _id: "69e387b312d268b6bb3b69de",
    name: "العناية بالجسم",
    icon: "🧼",
    description: "منتجات العناية بالجسم المصممة لتغذية بشرتك وترطيبها ومنحها الإشراقة الطبيعية. تشمل اللوشن، المقشرات، الزيوت المغذية، جل الاستحمام، كريمات اليد، وزيوت الجسم التي تمنحك بشرة ناعمة، صحية، ومشرقة تدوم طويلاً.",
    isActive: true,
    categoryKey: "bodycare"
  },
  {
    _id: "69e387b312d268b6bb3b69df",
    name: "العناية بالشعر",
    icon: "💇🏼‍♀️",
    description: "تشكيلة متكاملة من منتجات العناية بالشعر لشعر صحي، قوي، ولامع. تشمل الشامبو، البلسم، أقنعة الشعر المغذية، السيرومات، الزيوت الطبيعية، وعلاجات الترميم والتغذية التي تناسب جميع أنواع الشعر وتمنحه الحيوية والنعومة التي يستحقها.",
    isActive: true,
    categoryKey: "haircare"
  },
  {
    _id: "69e387b312d268b6bb3b69e0",
    name: "العناية بالرجال",
    icon: "🧔🏼‍♂️",
    description: "منتجات العناية الشخصية المصممة خصيصاً للرجال لتلبية احتياجاتهم اليومية. تشمل ماكينات الحلاقة، كريمات وكريمات ما بعد الحلاقة، زيوت اللحية والعناية بها، مزيلات العرق، وشامبو وجل استحمام يعزز الانتعاش والثقة طوال اليوم.",
    isActive: true,
    categoryKey: "mens_grooming"
  },
  {
    _id: "69e387b312d268b6bb3b69e1",
    name: "أخرى",
    icon: "📦",
    description: "مستلزمات وإكسسوارات متنوعة تكمل روتين جمالك. تشمل حقائب المكياج العملية، المرايا، طقم الهدايا الفاخرة، أدوات تنظيف الفرش، ومنتجات أخرى مبتكرة تنظم وتسهل روتين العناية اليومي بلمسة أنيقة.",
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