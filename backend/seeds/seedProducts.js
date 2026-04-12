const mongoose = require("mongoose");
const Product = require("../models/product"); 
require("dotenv").config();

const seedData = [
  //toners
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Dermacy Moisturizing Milky Toner 150ML",
    description:
      "Milky toner for all skin types, purifies skin cells and minimizes pores.",
    brand: "Dermacy",
    price: 293,
    stock: 20,
    images: [
      "uploads/Dermacy toner.avif",
      "uploads/Dermacy toner - Copy.avif",
      "uploads/Dermacy toner - Copy (2).avif",
    ],
    skinType: "normal",
    weight: 0.15,
    dimensions: { length: 15, width: 5, height: 5 },
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Kolagra Brightening Face Toner",
    description:
      "Rich in Vitamin E, Alpha Arbutin & Niacinamide for skin whitening.",
    brand: "Kolagra",
    price: 122,
    stock: 15,
    images: [
      "uploads/Kolagra whitening toner.avif",
      "uploads/Kolagra whitening toner - Copy.avif",
      "uploads/Kolagra whitening toner - Copy (2).avif",
    ],
    skinType: "normal",
    weight: 0.25,
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Kolagra Anti-Shine Face Toner",
    description: "Rich in Niacinamide and Glycolic Acid, eliminates shine.",
    brand: "Kolagra",
    price: 105,
    stock: 12,
    images: [
      "uploads/Kolagra anti-shine toner.avif",
      "uploads/Kolagra anti-shine toner - Copy.avif",
      "uploads/Kolagra anti-shine toner - Copy (2).avif",
    ],
    skinType: "oily",
    weight: 0.25,
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Alejon Facial Toner",
    price: 260,
    description:
      "Contains Glycolic acid, Niacinamide and Tea tree oil for deep cleansing.",
    brand: "Alejon",
    stock: 10,
    images: [
      "uploads/aligone facial toner.avif",
      "uploads/aligone facial toner - Copy.avif",
      "uploads/aligone facial toner - Copy (2).avif",
    ],
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Tersus Glycolic Toner Solution 220ml",
    price: 207,
    description:
      "8% Glycolic Acid solution to remove dead skin and reduce fine wrinkles.",
    brand: "Tersus",
    stock: 8,
    images: [
      "uploads/tersus glycolic toner.avif",
      "uploads/tersus glycolic toner - Copy.avif",
      "uploads/tersus glycolic toner - Copy (2).avif",
    ],
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Moist-1 Toner",
    price: 180,
    description:
      "Toner for dry and normal skin, removes impurities and makeup.",
    brand: "MOIST-1",
    stock: 25,
    images: [
      "uploads/moist-1 toner.avif",
      "uploads/moist-1 toner - Copy.avif",
      "uploads/moist-1 toner - Copy (2).avif",
    ],
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7dd",
    name: "Jamira toner",
    price: 150,
    description:
      "Toner for oily and acne-prone skin, contains Salicylic acid and Tea tree oil.",
    brand: "Jamira",
    stock: 20,
    images: [
        "uploads/jamira toner.avif",
        "uploads/jamira toner - Copy.avif",
        "uploads/jamira toner - Copy (2).avif",
    ]},
  //cleansers
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d8",
    name: "Vichy Normaderm Intense Purifying Cleanser 200ML",
    price: 688,
    description: "Intense purifying gel for oily and acne-prone skin.",
    brand: "Vichy",
    stock: 15,
    images: [
      "uploads/vichi1.avif",
      "uploads/vichy-2.avif",
      "uploads/vichy-3.avif",
    ],
    skinType: "oily",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d8",
    name: "StarVille Facial Cleanser Gel 400ML",
    price: 210,
    description: "Anti-bacterial cleanser for combination and oily skin.",
    brand: "StarVille",
    stock: 30,
    images: [
      "uploads/starvill1.avif",
      "uploads/starville-2.avif",
      "uploads/starville-3.avif",
    ],
    skinType: "combination",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d8",
    name: "Dermacy Foaming Face Cleanser",
    price: 266,
    description: "Gentle foaming cleanser for sensitive and dry skin.",
    brand: "Dermacy",
    stock: 20,
    images: [
      "uploads/dermacy foam cleanser 1.avif",
      "uploads/dermacy foam cleanser 2.avif",
      "uploads/dermacy foam cleanser 3.avif",
    ],
    skinType: "dry",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d8",
    name: "Clearsal Gentle Anti-Acne Cleanser",
    price: 198,
    description: "Gentle cleanser designed for acne-prone skin.",
    brand: "Clearsal",
    stock: 25,
    images: [
      "uploads/clearsal cleanser 1.avif",
      "uploads/clearsal cleanser 2.avif",
      "uploads/clearsal cleanser 3.avif",
    ],
    skinType: "oily",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d8",
    name: "Dr. Elvish Cica Calming Cleanser 200ML",
    price: 235,
    description:
      "Calming cleanser with Cica extract, ideal for sensitive skin.",
    brand: "Dr. Elvish",
    stock: 12,
    images: [
      "uploads/dr elvich cleanse 1.avif",
      "uploads/dr elvich cleanse 2.avif",
      "uploads/dr elvich cleanse 3.avif",
    ],
    skinType: "sensitive",
  },
  //moisturizers
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d9",
    name: "CeraVe Moisturizing Cream",
    price: 420,
    description: "Rich moisturizing cream for dry to very dry skin",
    brand: "CeraVe",
    stock: 15,
    images: [
      "uploads/cerave-lotion-mostrizer1.avif",
      "uploads/cerave-lotion-mostrizer2.avif",
      "uploads/cerave-lotion-mostrizer3.avif",
    ],
    skinType: "dry",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d9",
    name: "Blanki Moisturizing Cream",
    price: 350,
    description: "Specialized moisturizer for baby skin, gentle and nourishing",
    brand: "Blanki",
    stock: 20,
    images: [
      "uploads/blanki-mostrizer1.avif",
      "uploads/blanki-mostrizer2.avif",
      "uploads/blanki-mostrizer3.avif",
    ],
    skinType: "normal",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d9",
    name: "Dermactive Acti-Clear",
    price: 544,
    description: "Anti-blemish moisturizing cream for acne-prone skin",
    brand: "Dermactive",
    stock: 10,
    images: [
      "uploads/dermactive-get-mostrizer1.avif",
      "uploads/dermactive-get-mostrizer2.avif",
      "uploads/dermactive-get-mostrizer3.avif",
    ],
    skinType: "oily",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d9",
    name: "Laylac Hydrating Cream",
    price: 515,
    description: "Advanced hydrating formula for skin barrier repair",
    brand: "Laylac",
    stock: 12,
    images: [
      "uploads/laylac-mostrizer1.avif",
      "uploads/laylac-mostrizer2.avif",
      "uploads/laylac-mostrizer3.avif",
    ],
    skinType: "oily",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7d9",
    name: "SESH The All-rounder",
    price: 450,
    description: "Lightweight moisturizer suitable for daily use",
    brand: "SESH",
    stock: 18,
    images: [
      "uploads/sesh1.avif",
      "uploads/sesh-2.avif",
      "uploads/sesh-3.avif",
    ],
    skinType: "oily",
  },
  //serums
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7da",
    name: "Shine & White Serum",
    price: 390,
    description: "Brightening serum for a radiant complexion.",
    brand: "Shine & White",
    stock: 15,
    images: [
      "uploads/shine-and-white1.avif",
      "uploads/shine-and-white2.avif",
      "uploads/shine-and-white3.avif",
    ],
    skinType: "normal",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7da",
    name: "ordinor even tone serium ",
    price: 410,
    description:
      "Ultra-lightweight whitening serum support with marine-derived water reservoirs.",
    brand: "ordinor",
    stock: 10,
    images: [
      "../uploads/ordinor-serum1.avif",
      "uploads/ordinor-serum2.avif",
      "uploads/ordinor-serum3.avif",
    ],
    skinType: "normal",
  },
  {
    owner_store_id: "69d0ddd76d08a00080101c4a",
    category_id: "69d15385a31851143f01d7da",
    name: "Dermaelle Advanced skin booster microneedling Serum",

    price: 520,
    description:
      "Anti-aging retinol serum to improve skin texture and reduce fine lines.",
    brand: "Dermaelle",
    stock: 8,
    images: [
      "uploads/derma-el-1.jpg",
      "uploads/derma-el-2.jpg",
      "uploads/derma-el-3.jpg",
    ],
    skinType: "normal",
  },
];

const SeedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

  
    // await Product.deleteMany({});

    await Product.insertMany(seedData);
    console.log(" All products seeded successfully!");
    process.exit();
  } catch (err) {
    console.error(" Seeding failed:", err);
    process.exit(1);
  }
};

SeedDB();
