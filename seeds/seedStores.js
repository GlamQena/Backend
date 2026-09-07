const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { storeOwnerModel } = require("../models/users/storeOwner");
const connect_mongodb = require("../config/connectMongoDB.js");
const cloudinary_config = require("../config/connectCloudinary");

// Initialize Cloudinary
cloudinary_config();

// Helper to get file hash
const getFileHash = (buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

// Helper to check if image already exists in database
const checkExistingImage = async (fileHash, model) => {
    try {
        // Check if any store has this hash
        const existingStore = await model.findOne({ logo_hash: fileHash });
        if (existingStore && existingStore.logo) {
            console.log(`Found existing image with hash: ${fileHash.substring(0, 10)}...`);
            return {
                exists: true,
                url: existingStore.logo,
                hash: existingStore.logo_hash
            };
        }
        return { exists: false };
    } catch (error) {
        console.error('Error checking existing image:', error);
        return { exists: false };
    }
};

// Direct upload function with duplicate check
const uploadLogoWithDuplicateCheck = async (fileBuffer, originalname, model) => {
    const fileHash = getFileHash(fileBuffer);
    
    // First, check if this image already exists in the database
    const existing = await checkExistingImage(fileHash, model);
    if (existing.exists) {
        console.log(`Using existing image (no new upload needed)`);
        return {
            url: existing.url,
            hash: existing.hash,
            isNew: false
        };
    }
    
    // No duplicate found - upload to Cloudinary
    console.log(`Uploading new image to Cloudinary...`);
    return new Promise((resolve, reject) => {
        const publicId = `${originalname.split('.')[0]}-${Date.now()}-${fileHash.substring(0, 8)}`;
        
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "GlamQena/stores",
                allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
                public_id: publicId,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        hash: fileHash,
                        isNew: true
                    });
                }
            }
        );

        // Convert buffer to stream
        const Readable = require('stream').Readable;
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

let stores = [
  {
    username: "qena_beauty_corner",
    firstName: "أحمد",
    lastName: "محمود",
    email: "qena.beauty.corner@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Beauty Corner",
    logo: "",
    logo_hash: "",

    store_phone: "01012345678",
    store_email: "qena.beauty.corner.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع المحطة",
    },

    store_description:
      "متجر متخصص في مستحضرات التجميل والمكياج ومنتجات العناية بالبشرة والشعر.",
    
    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_glow_store",
    firstName: "محمد",
    lastName: "حسن",
    email: "qena.glow.store@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Glow Store",
    logo: "",
    logo_hash: "",

    store_phone: "01112345678",
    store_email: "qena.glow.store.business@example.com",

    store_address: {
      city: "قنا",
      district: "المنطقة المركزية",
      street: "شارع الجمهورية",
    },

    store_description:
      "منتجات مختارة للعناية بالبشرة والجسم والمكياج للاستخدام اليومي.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "beauty_house_qena",
    firstName: "عمر",
    lastName: "علي",
    email: "beauty.house.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Beauty House Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01212345678",
    store_email: "beauty.house.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع 23 يوليو",
    },

    store_description:
      "تشكيلة متنوعة من المكياج ومنتجات العناية بالبشرة والشعر والعطور.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "makeup_world_qena",
    firstName: "يوسف",
    lastName: "أحمد",
    email: "makeup.world.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Makeup World Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01512345678",
    store_email: "makeup.world.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الشئون",
      street: "شارع مصطفى كامل",
    },

    store_description:
      "متجر متخصص في المكياج وأدوات التجميل ومنتجات العناية الشخصية.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "skin_care_qena",
    firstName: "محمود",
    lastName: "إبراهيم",
    email: "skin.care.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Skin Care Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01023456789",
    store_email: "skin.care.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع كورنيش النيل",
    },

    store_description:
      "منتجات للعناية بالبشرة تشمل المنظفات والتونرات والمرطبات والسيرومات.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "glam_qena",
    firstName: "عبدالرحمن",
    lastName: "سعيد",
    email: "glam.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Glam Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01123456789",
    store_email: "glam.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "المنطقة التعليمية",
      street: "شارع المدارس",
    },

    store_description:
      "كل ما تحتاجينه لإطلالة مميزة من منتجات المكياج والعناية بالبشرة.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "rose_beauty_qena",
    firstName: "كريم",
    lastName: "حمدي",
    email: "rose.beauty.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Rose Beauty Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01223456789",
    store_email: "rose.beauty.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الأشراف",
      street: "شارع المدارس",
    },

    store_description:
      "منتجات تجميل وعناية شخصية مختارة بعناية لتناسب احتياجاتك اليومية.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "beauty_choice_qena",
    firstName: "طارق",
    lastName: "محمد",
    email: "beauty.choice.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Beauty Choice",
    logo: "",
    logo_hash: "",

    store_phone: "01523456789",
    store_email: "beauty.choice.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "مدينة قنا الجديدة",
      street: "شارع الجامعة",
    },

    store_description:
      "اختيارات متنوعة من المكياج والعناية بالبشرة والشعر بأسعار مناسبة.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_cosmetics_hub",
    firstName: "إسلام",
    lastName: "حسين",
    email: "qena.cosmetics.hub@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Cosmetics Hub",
    logo: "",
    logo_hash: "",

    store_phone: "01034567890",
    store_email: "qena.cosmetics.hub.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحصواية",
      street: "شارع التحرير",
    },

    store_description:
      "متجر شامل لمستحضرات التجميل والعناية الشخصية والعطور.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "pretty_lady_qena",
    firstName: "حسام",
    lastName: "عادل",
    email: "pretty.lady.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Pretty Lady Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01134567890",
    store_email: "pretty.lady.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع سعد زغلول",
    },

    store_description:
      "منتجات مكياج وعناية بالبشرة والشعر للمرأة العصرية.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_beauty_land",
    firstName: "أحمد",
    lastName: "سامي",
    email: "qena.beauty.land@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Beauty Land",
    logo: "",
    logo_hash: "",

    store_phone: "01234567890",
    store_email: "qena.beauty.land.store@example.com",

    store_address: {
      city: "قنا",
      district: "الشنهورية",
      street: "شارع المركز",
    },

    store_description:
      "عالم من منتجات المكياج والعناية بالبشرة والجسم والشعر.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "natural_glow_qena",
    firstName: "مصطفى",
    lastName: "خالد",
    email: "natural.glow.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Natural Glow Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01534567890",
    store_email: "natural.glow.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الأشراف البحرية",
      street: "شارع النيل",
    },

    store_description:
      "منتجات طبيعية ومختارة للعناية بالبشرة والشعر والجسم.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "makeup_corner_qena",
    firstName: "وليد",
    lastName: "عمر",
    email: "makeup.corner.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Makeup Corner Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01045678901",
    store_email: "makeup.corner.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الشئون",
      street: "شارع الجمهورية",
    },

    store_description:
      "مستحضرات مكياج وأدوات تجميل تناسب الإطلالات اليومية والمناسبات.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_skin_lab",
    firstName: "أشرف",
    lastName: "محمود",
    email: "qena.skin.lab@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Skin Lab",
    logo: "",
    logo_hash: "",

    store_phone: "01145678901",
    store_email: "qena.skin.lab.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحصواية",
      street: "شارع 15 مايو",
    },

    store_description:
      "منتجات متخصصة للعناية بالبشرة وتنظيفها وترطيبها وحمايتها.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "beauty_boutique_qena",
    firstName: "سيف",
    lastName: "ياسر",
    email: "beauty.boutique.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Beauty Boutique Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01245678901",
    store_email: "beauty.boutique.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع بورسعيد",
    },

    store_description:
      "بوتيك متخصص في المكياج ومنتجات العناية والجمال.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "glow_beauty_qena",
    firstName: "عبدالله",
    lastName: "رمضان",
    email: "glow.beauty.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Glow Beauty Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01545678901",
    store_email: "glow.beauty.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الشنهورية",
      street: "شارع المروة",
    },

    store_description:
      "منتجات تساعدك على الحصول على بشرة نضرة وإطلالة مميزة كل يوم.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_hair_care",
    firstName: "مروان",
    lastName: "حسن",
    email: "qena.hair.care@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Hair Care",
    logo: "",
    logo_hash: "",

    store_phone: "01056789012",
    store_email: "qena.hair.care.store@example.com",

    store_address: {
      city: "قنا",
      district: "الأشراف",
      street: "شارع الكورنيش",
    },

    store_description:
      "متجر متخصص في منتجات العناية بالشعر والزيوت والشامبوهات والماسكات.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "beauty_market_qena",
    firstName: "ياسر",
    lastName: "علي",
    email: "beauty.market.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Beauty Market Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01156789012",
    store_email: "beauty.market.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع خلف الطوابين",
    },

    store_description:
      "سوق متكامل لمنتجات التجميل والعناية الشخصية والعطور.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_luxury_beauty",
    firstName: "حازم",
    lastName: "أحمد",
    email: "qena.luxury.beauty@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Luxury Beauty",
    logo: "",
    logo_hash: "",

    store_phone: "01256789012",
    store_email: "qena.luxury.beauty.store@example.com",

    store_address: {
      city: "قنا",
      district: "مدينة قنا الجديدة",
      street: "شارع الجامعة",
    },

    store_description:
      "منتجات تجميل وعناية مختارة بعناية لمحبي الجودة والإطلالة الفاخرة.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "pretty_glow_qena",
    firstName: "شريف",
    lastName: "حسين",
    email: "pretty.glow.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Pretty Glow Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01556789012",
    store_email: "pretty.glow.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحصواية",
      street: "شارع الصفا",
    },

    store_description:
      "منتجات مكياج وعناية بالبشرة تساعدك على إبراز جمالك الطبيعي.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_beauty_spot",
    firstName: "كريم",
    lastName: "نبيل",
    email: "qena.beauty.spot@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Beauty Spot",
    logo: "",
    logo_hash: "",

    store_phone: "01067890123",
    store_email: "qena.beauty.spot.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع العقاد",
    },

    store_description:
      "وجهتك المحلية لمنتجات المكياج والعناية بالبشرة والشعر.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "skin_glow_qena",
    firstName: "رامي",
    lastName: "عادل",
    email: "skin.glow.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Skin Glow Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01167890123",
    store_email: "skin.glow.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الأشراف",
      street: "شارع الإصلاح",
    },

    store_description:
      "منتجات للعناية بالبشرة والترطيب والتنظيف والحفاظ على نضارة البشرة.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_makeup_house",
    firstName: "فارس",
    lastName: "محمد",
    email: "qena.makeup.house@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Makeup House",
    logo: "",
    logo_hash: "",

    store_phone: "01278901234",
    store_email: "qena.makeup.house.store@example.com",

    store_address: {
      city: "قنا",
      district: "الشنهورية",
      street: "شارع توفيق الحكيم",
    },

    store_description:
      "متجر متخصص في منتجات المكياج وأدوات التجميل لجميع المناسبات.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "beauty_plus_qena",
    firstName: "سامح",
    lastName: "محمود",
    email: "beauty.plus.qena@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Beauty Plus Qena",
    logo: "",
    logo_hash: "",

    store_phone: "01578901234",
    store_email: "beauty.plus.qena.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحصواية",
      street: "شارع المروة",
    },

    store_description:
      "منتجات متنوعة للعناية الشخصية والمكياج والبشرة والشعر.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_care_center",
    firstName: "زياد",
    lastName: "خالد",
    email: "qena.care.center@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Care Center",
    logo: "",
    logo_hash: "",

    store_phone: "01089012345",
    store_email: "qena.care.center.store@example.com",

    store_address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع النجدة",
    },

    store_description:
      "متجر للعناية بالبشرة والشعر والجسم مع مجموعة متنوعة من مستحضرات التجميل.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_beauty_collection",
    firstName: "عمرو",
    lastName: "سعيد",
    email: "qena.beauty.collection@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Beauty Collection",
    logo: "",
    logo_hash: "",

    store_phone: "01189012345",
    store_email: "qena.beauty.collection.store@example.com",

    store_address: {
      city: "قنا",
      district: "مدينة قنا الجديدة",
      street: "شارع الخدمات",
    },

    store_description:
      "مجموعة متنوعة من منتجات المكياج والعناية بالبشرة والجسم والشعر.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },

  {
    username: "qena_cosmetic_house",
    firstName: "أيمن",
    lastName: "حمدي",
    email: "qena.cosmetic.house@example.com",
    password: "Password123!",
    role: "store_owner",

    store_name: "Qena Cosmetic House",
    logo: "",
    logo_hash: "",

    store_phone: "01290123456",
    store_email: "qena.cosmetic.house.store@example.com",

    store_address: {
      city: "قنا",
      district: "الشئون",
      street: "شارع عبد المنعم رياض",
    },

    store_description:
      "متجر محلي لمستحضرات التجميل والمكياج والعناية الشخصية.",

    isEmailVerified: true,
    isStoreEmailVerified: true,

    total_products: 0,
    total_orders: 0,
    average_rating: 0,
    total_rates: 0,

    is_approved: true,
    deletion_requested: false,
    deletion_status: "pending",
    isActive: true,
  },
];

const seedStores = async () => {
    try {
        const saltRounds = 10;
        await connect_mongodb();

        // Hash passwords
        const storesWithHashedPasswords = [];
        for (const store of stores) {
            const hashedPassword = await bcrypt.hash(store.password, saltRounds);
            storesWithHashedPasswords.push({
                ...store,
                password: hashedPassword
            });
        }

        // Get available logo files
        const logosDir = path.join(__dirname, "../sources/stores_logos");
        let availableLogos = [];
        
        if (fs.existsSync(logosDir)) {
            const files = fs.readdirSync(logosDir);
            availableLogos = files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
                })
                .sort();
        }

        console.log(`📁 Found ${availableLogos.length} logo files available`);
        console.log(`📊 Processing ${storesWithHashedPasswords.length} stores...\n`);

        // Track which logos have been used (to avoid uploading same file multiple times)
        const usedLogos = new Map(); // key: logo filename, value: { url, hash }

        // Process each store with duplicate check
        const processedStores = [];
        let newUploads = 0;
        let reusedImages = 0;

        for (let i = 0; i < storesWithHashedPasswords.length; i++) {
            const store = storesWithHashedPasswords[i];
            const logoIndex = i % availableLogos.length;
            const assignedLogo = availableLogos[logoIndex];
            const logoPath = path.join(logosDir, assignedLogo);

            console.log(`📦 ${store.store_name}`);
            console.log(`Assigned logo: ${assignedLogo}`);

            let logo = "";
            let logo_hash = "";

            if (logoPath && fs.existsSync(logoPath)) {
                try {
                    const fileBuffer = fs.readFileSync(logoPath);
                    const fileHash = getFileHash(fileBuffer);
                    
                    // Check if this specific logo file was already used in this seeding session
                    if (usedLogos.has(assignedLogo)) {
                        const existing = usedLogos.get(assignedLogo);
                        logo = existing.url;
                        logo_hash = existing.hash;
                        reusedImages++;
                        console.log(`Reusing logo from current session (already uploaded)`);
                    } else {
                        // Check in database and upload if needed
                        const result = await uploadLogoWithDuplicateCheck(fileBuffer, assignedLogo, storeOwnerModel);
                        logo = result.url;
                        logo_hash = result.hash;
                        
                        if (result.isNew) {
                            newUploads++;
                            usedLogos.set(assignedLogo, { url: logo, hash: logo_hash });
                            console.log(`New logo uploaded successfully`);
                        } else {
                            reusedImages++;
                            usedLogos.set(assignedLogo, { url: logo, hash: logo_hash });
                            console.log(`Using existing logo from database`);
                        }
                    }
                } catch (error) {
                    console.error(`Error uploading logo:`, error.message);
                }
            } else {
                console.warn(`Logo file not found, skipping logo`);
            }

            processedStores.push({
                ...store,
                logo: logo,
                logo_hash: logo_hash
            });
            
            console.log(`Store will be saved with logo: ${logo ? 'YES' : 'NO'}\n`);
        }

        // Insert stores into database
        console.log(`Saving stores to database...`);
        const createdStores = [];
        for (const store of processedStores) {
            try {
                const newStore = new storeOwnerModel(store);
                await newStore.save();
                createdStores.push(newStore);
            } catch (error) {
                console.error(`❌ Error creating store ${store.store_name}:`, error.message);
            }
        }

        console.log(`\n🎉 Successfully seeded ${createdStores.length} stores!`);
        console.log(`📊 Stores with logos: ${createdStores.filter(s => s.logo).length}`);
        console.log(`📊 Stores without logos: ${createdStores.filter(s => !s.logo).length}`);
        console.log(`📊 New uploads to Cloudinary: ${newUploads}`);
        console.log(`📊 Reused images: ${reusedImages}`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error in seedStores:", error);
        process.exit(1);
    }
};

seedStores();