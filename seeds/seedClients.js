const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { clientModel } = require("../models/users/client");
const connect_mongodb = require("../config/connectMongoDB.js");
const cloudinary_config = require("../config/connectCloudinary");

const clients = [
  // ==================== MALES (5) ====================
  {
    username: "ahmed_ali",
    firstName: "أحمد",
    lastName: "علي",
    email: "ahmed.ali.1999@example.com",
    password: "Password123!",
    phoneNumber: "01012345678",
    address: {
      city: "قنا",
      district: "مدينة قنا",
      street: "شارع الجمهورية",
    },
    birthdate: new Date("1999-04-15"),
    gender: "male",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "mohamed_hassan",
    firstName: "محمد",
    lastName: "حسن",
    email: "mohamed.hassan.1998@example.com",
    password: "Password123!",
    phoneNumber: "01123456789",
    address: {
      city: "قنا",
      district: "الكنوز",
      street: "شارع المدارس",
    },
    birthdate: new Date("1998-08-22"),
    gender: "male",
    skinType: "مختلطة",
    skinConcerns: ["حب الشباب", "هالات سوداء"],
    notifications: ["email"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "omar_sayed",
    firstName: "عمر",
    lastName: "سيد",
    email: "omar.sayed.2000@example.com",
    password: "Password123!",
    phoneNumber: "01234567890",
    address: {
      city: "قنا",
      district: "المعنا",
      street: "شارع النيل",
    },
    birthdate: new Date("2000-01-10"),
    gender: "male",
    skinType: "عادية",
    skinConcerns: [],
    notifications: ["push", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "khaled_hamdy",
    firstName: "خالد",
    lastName: "حمدي",
    email: "khaled.hamdy.1996@example.com",
    password: "Password123!",
    phoneNumber: "01567890123",
    address: {
      city: "قنا",
      district: "مدينة قنا",
      street: "شارع المحطة",
    },
    birthdate: new Date("1996-10-09"),
    gender: "male",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات"],
    notifications: ["email"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "karim_ahmed",
    firstName: "كريم",
    lastName: "أحمد",
    email: "karim.ahmed.1999@example.com",
    password: "Password123!",
    phoneNumber: "01067890125",
    address: {
      city: "قنا",
      district: "مدينة العمال",
      street: "شارع المحطة",
    },
    birthdate: new Date("1999-05-24"),
    gender: "male",
    skinType: "مختلطة",
    skinConcerns: ["حب الشباب", "جفاف"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },

  // ==================== FEMALES (20) ====================
  {
    username: "mariam_ahmed",
    firstName: "مريم",
    lastName: "أحمد",
    email: "mariam.ahmed.2002@example.com",
    password: "Password123!",
    phoneNumber: "01167890123",
    address: {
      city: "قنا",
      district: "مدينة العمال",
      street: "شارع الجامعة",
    },
    birthdate: new Date("2002-03-25"),
    gender: "female",
    skinType: "مختلطة",
    skinConcerns: ["حب الشباب", "تصبغات", "هالات سوداء"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "sara_mohamed",
    firstName: "سارة",
    lastName: "محمد",
    email: "sara.mohamed.2000@example.com",
    password: "Password123!",
    phoneNumber: "01278901234",
    address: {
      city: "قنا",
      district: "الكنوز",
      street: "شارع الأهرام",
    },
    birthdate: new Date("2000-09-14"),
    gender: "female",
    skinType: "حساسة",
    skinConcerns: ["جفاف", "تصبغات"],
    notifications: ["email"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "nour_khaled",
    firstName: "نور",
    lastName: "خالد",
    email: "nour.khaled.2001@example.com",
    password: "Password123!",
    phoneNumber: "01589012345",
    address: {
      city: "قنا",
      district: "المعنا",
      street: "شارع النصر",
    },
    birthdate: new Date("2001-12-07"),
    gender: "female",
    skinType: "جافة",
    skinConcerns: ["جفاف"],
    notifications: ["push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "jana_ashraf",
    firstName: "جنى",
    lastName: "أشرف",
    email: "jana.ashraf.2003@example.com",
    password: "Password123!",
    phoneNumber: "01090123456",
    address: {
      city: "قنا",
      district: "الشئون",
      street: "شارع المدارس",
    },
    birthdate: new Date("2003-02-19"),
    gender: "female",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات"],
    notifications: ["email", "push", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "farah_hany",
    firstName: "فرح",
    lastName: "هاني",
    email: "farah.hany.1999@example.com",
    password: "Password123!",
    phoneNumber: "01101234567",
    address: {
      city: "قنا",
      district: "مدينة قنا",
      street: "شارع سعد زغلول",
    },
    birthdate: new Date("1999-07-28"),
    gender: "female",
    skinType: "عادية",
    skinConcerns: ["هالات سوداء"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "yara_tarek",
    firstName: "يارا",
    lastName: "طارق",
    email: "yara.tarek.2002@example.com",
    password: "Password123!",
    phoneNumber: "01212345678",
    address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع البحر",
    },
    birthdate: new Date("2002-10-11"),
    gender: "female",
    skinType: "مختلطة",
    skinConcerns: ["حب الشباب", "جفاف"],
    notifications: ["email"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "salma_ayman",
    firstName: "سلمى",
    lastName: "أيمن",
    email: "salma.ayman.2001@example.com",
    password: "Password123!",
    phoneNumber: "01523456789",
    address: {
      city: "قنا",
      district: "مدينة العمال",
      street: "شارع التحرير",
    },
    birthdate: new Date("2001-05-06"),
    gender: "female",
    skinType: "حساسة",
    skinConcerns: ["جفاف", "هالات سوداء"],
    notifications: ["push", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "aya_samir",
    firstName: "آية",
    lastName: "سمير",
    email: "aya.samir.2000@example.com",
    password: "Password123!",
    phoneNumber: "01034567890",
    address: {
      city: "قنا",
      district: "المعنا",
      street: "شارع الجمهورية",
    },
    birthdate: new Date("2000-04-21"),
    gender: "female",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات", "هالات سوداء"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "menna_waleed",
    firstName: "منة",
    lastName: "وليد",
    email: "menna.waleed.2003@example.com",
    password: "Password123!",
    phoneNumber: "01145678901",
    address: {
      city: "قنا",
      district: "الشئون",
      street: "شارع المدارس",
    },
    birthdate: new Date("2003-08-13"),
    gender: "female",
    skinType: "جافة",
    skinConcerns: ["جفاف", "تصبغات"],
    notifications: ["email", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "reem_ahmed",
    firstName: "ريم",
    lastName: "أحمد",
    email: "reem.ahmed.1998@example.com",
    password: "Password123!",
    phoneNumber: "01256789012",
    address: {
      city: "قنا",
      district: "الكنوز",
      street: "شارع النيل",
    },
    birthdate: new Date("1998-02-27"),
    gender: "female",
    skinType: "عادية",
    skinConcerns: [],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "huda_mohamed",
    firstName: "هدى",
    lastName: "محمد",
    email: "huda.mohamed.1997@example.com",
    password: "Password123!",
    phoneNumber: "01012346789",
    address: {
      city: "قنا",
      district: "الكنوز",
      street: "شارع الأهرام",
    },
    birthdate: new Date("1997-09-20"),
    gender: "female",
    skinType: "مختلطة",
    skinConcerns: ["تصبغات", "هالات سوداء"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "esraa_khaled",
    firstName: "إسراء",
    lastName: "خالد",
    email: "esraa.khaled.2002@example.com",
    password: "Password123!",
    phoneNumber: "01123457890",
    address: {
      city: "قنا",
      district: "المعنا",
      street: "شارع النيل",
    },
    birthdate: new Date("2002-01-29"),
    gender: "female",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات"],
    notifications: ["push", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "habiba_ahmed",
    firstName: "حبيبة",
    lastName: "أحمد",
    email: "habiba.ahmed.2003@example.com",
    password: "Password123!",
    phoneNumber: "01234567891",
    address: {
      city: "قنا",
      district: "مدينة قنا",
      street: "شارع الجمهورية",
    },
    birthdate: new Date("2003-07-12"),
    gender: "female",
    skinType: "حساسة",
    skinConcerns: ["جفاف", "حب الشباب"],
    notifications: ["email", "push", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "tasneem_omar",
    firstName: "تسنيم",
    lastName: "عمر",
    email: "tasneem.omar.2001@example.com",
    password: "Password123!",
    phoneNumber: "01545678912",
    address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع الجامعة",
    },
    birthdate: new Date("2001-04-03"),
    gender: "female",
    skinType: "عادية",
    skinConcerns: ["هالات سوداء"],
    notifications: ["email"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "malak_yasser",
    firstName: "ملك",
    lastName: "ياسر",
    email: "malak.yasser.2002@example.com",
    password: "Password123!",
    phoneNumber: "01078912345",
    address: {
      city: "قنا",
      district: "مدينة قنا",
      street: "شارع النصر",
    },
    birthdate: new Date("2002-06-16"),
    gender: "female",
    skinType: "مختلطة",
    skinConcerns: ["تصبغات", "جفاف"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "laila_samir",
    firstName: "ليلى",
    lastName: "سمير",
    email: "laila.samir.1999@example.com",
    password: "Password123!",
    phoneNumber: "01134567890",
    address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع بورسعيد",
    },
    birthdate: new Date("1999-11-08"),
    gender: "female",
    skinType: "جافة",
    skinConcerns: ["جفاف", "هالات سوداء"],
    notifications: ["push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "salma_hassan",
    firstName: "سلمى",
    lastName: "حسن",
    email: "salma.hassan.2000@example.com",
    password: "Password123!",
    phoneNumber: "01267890123",
    address: {
      city: "قنا",
      district: "المعنا",
      street: "شارع التحرير",
    },
    birthdate: new Date("2000-02-14"),
    gender: "female",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات"],
    notifications: ["email", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "rawan_ahmed",
    firstName: "روان",
    lastName: "أحمد",
    email: "rawan.ahmed.2003@example.com",
    password: "Password123!",
    phoneNumber: "01578901234",
    address: {
      city: "قنا",
      district: "الكنوز",
      street: "شارع الجامعة",
    },
    birthdate: new Date("2003-09-26"),
    gender: "female",
    skinType: "حساسة",
    skinConcerns: ["جفاف", "تصبغات"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "doaa_mahmoud",
    firstName: "دعاء",
    lastName: "محمود",
    email: "doaa.mahmoud.1998@example.com",
    password: "Password123!",
    phoneNumber: "01089012345",
    address: {
      city: "قنا",
      district: "مدينة العمال",
      street: "شارع النيل",
    },
    birthdate: new Date("1998-12-05"),
    gender: "female",
    skinType: "عادية",
    skinConcerns: ["هالات سوداء"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "shimaa_adel",
    firstName: "شيماء",
    lastName: "عادل",
    email: "shimaa.adel.1997@example.com",
    password: "Password123!",
    phoneNumber: "01190123456",
    address: {
      city: "قنا",
      district: "الشئون",
      street: "شارع الجمهورية",
    },
    birthdate: new Date("1997-05-19"),
    gender: "female",
    skinType: "مختلطة",
    skinConcerns: ["حب الشباب", "هالات سوداء"],
    notifications: ["push", "sms"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "aya_khaled",
    firstName: "آية",
    lastName: "خالد",
    email: "aya.khaled.2002@example.com",
    password: "Password123!",
    phoneNumber: "01201234567",
    address: {
      city: "قنا",
      district: "مدينة قنا",
      street: "شارع المدارس",
    },
    birthdate: new Date("2002-08-31"),
    gender: "female",
    skinType: "دهنية",
    skinConcerns: ["حب الشباب", "تصبغات"],
    notifications: ["email"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
  {
    username: "sama_ahmed",
    firstName: "سما",
    lastName: "أحمد",
    email: "sama.ahmed.2001@example.com",
    password: "Password123!",
    phoneNumber: "01512345678",
    address: {
      city: "قنا",
      district: "الحميدات",
      street: "شارع المحطة",
    },
    birthdate: new Date("2001-10-17"),
    gender: "female",
    skinType: "جافة",
    skinConcerns: ["جفاف"],
    notifications: ["email", "push"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    wishlist: [],
    totalSpent: 0,
    totalOrders: 0,
  },
];

// Initialize Cloudinary
cloudinary_config();

// Helper to get file hash
const getFileHash = (buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

// Helper to check if image already exists in database
const checkExistingImage = async (fileHash, model) => {
    try {
        const existingClient = await model.findOne({ avatar_hash: fileHash });
        if (existingClient && existingClient.avatar) {
            console.log(`   📌 Found existing image with hash: ${fileHash.substring(0, 10)}...`);
            return {
                exists: true,
                url: existingClient.avatar,
                hash: existingClient.avatar_hash
            };
        }
        return { exists: false };
    } catch (error) {
        console.error('Error checking existing image:', error);
        return { exists: false };
    }
};

// Direct upload function with duplicate check
const uploadAvatarWithDuplicateCheck = async (fileBuffer, originalname, model) => {
    const fileHash = getFileHash(fileBuffer);
    
    const existing = await checkExistingImage(fileHash, model);
    if (existing.exists) {
        console.log(`   ♻️ Using existing image (no new upload needed)`);
        return {
            url: existing.url,
            hash: existing.hash,
            isNew: false
        };
    }
    
    console.log(`   📤 Uploading new image to Cloudinary...`);
    return new Promise((resolve, reject) => {
        const publicId = `${originalname.split('.')[0]}-${Date.now()}-${fileHash.substring(0, 8)}`;
        
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "GlamQena/users",
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

        const Readable = require('stream').Readable;
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

const seedClients = async () => {
    try {
        const saltRounds = 10;
        await connect_mongodb();

        console.log(`📊 Processing ${clients.length} clients...\n`);

        // Hash passwords
        const clientsWithHashedPasswords = [];
        for (const client of clients) {
            const hashedPassword = await bcrypt.hash(client.password, saltRounds);
            clientsWithHashedPasswords.push({
                ...client,
                password: hashedPassword
            });
        }

        // Get available avatar files - separate by gender
        const avatarsDir = path.join(__dirname, "../sources/clients_avatars");
        
        let maleAvatars = [];
        let femaleAvatars = [];
        
        if (fs.existsSync(avatarsDir)) {
            const files = fs.readdirSync(avatarsDir);
            
            // Separate male and female avatars based on filename
            maleAvatars = files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext) && 
                           file.toLowerCase().startsWith('man_');
                })
                .sort();
            
            femaleAvatars = files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext) && 
                           file.toLowerCase().startsWith('girl_');
                })
                .sort();
        }

        console.log(`📁 Found ${maleAvatars.length} male avatars and ${femaleAvatars.length} female avatars`);
        console.log(`   Male avatars: ${maleAvatars.join(', ')}`);
        console.log(`   Female avatars: ${femaleAvatars.join(', ')}`);

        if (maleAvatars.length === 0) {
            console.warn("⚠️ No male avatar files found. Male clients will be created without avatars.");
        }
        if (femaleAvatars.length === 0) {
            console.warn("⚠️ No female avatar files found. Female clients will be created without avatars.");
        }

        // Track which avatars have been used (to avoid uploading same file multiple times)
        const usedAvatars = new Map();

        // Process each client with duplicate check
        const processedClients = [];
        let newUploads = 0;
        let reusedImages = 0;

        for (let i = 0; i < clientsWithHashedPasswords.length; i++) {
            const client = clientsWithHashedPasswords[i];
            const isMale = client.gender === 'male';
            
            // Get the appropriate avatar list based on gender
            const avatarList = isMale ? maleAvatars : femaleAvatars;
            
            // Calculate index within the gender-specific avatar list
            let genderIndex = 0;
            let assignedAvatar = null;
            
            if (avatarList.length > 0) {
                // Count how many clients of this gender have been processed so far
                const genderClients = clientsWithHashedPasswords
                    .slice(0, i + 1)
                    .filter(c => c.gender === client.gender);
                
                genderIndex = (genderClients.length - 1) % avatarList.length;
                assignedAvatar = avatarList[genderIndex];
            }

            const avatarPath = assignedAvatar ? path.join(avatarsDir, assignedAvatar) : null;

            console.log(`\n📦 ${client.firstName} ${client.lastName} (${client.username}) [${client.gender}]`);
            console.log(`   Assigned avatar: ${assignedAvatar || 'NONE'}`);

            let avatar = "";
            let avatar_hash = "";

            if (avatarPath && fs.existsSync(avatarPath)) {
                try {
                    const fileBuffer = fs.readFileSync(avatarPath);
                    const fileHash = getFileHash(fileBuffer);
                    
                    if (usedAvatars.has(assignedAvatar)) {
                        const existing = usedAvatars.get(assignedAvatar);
                        avatar = existing.url;
                        avatar_hash = existing.hash;
                        reusedImages++;
                        console.log(`   ♻️ Reusing avatar from current session (already uploaded)`);
                    } else {
                        const result = await uploadAvatarWithDuplicateCheck(fileBuffer, assignedAvatar, clientModel);
                        avatar = result.url;
                        avatar_hash = result.hash;
                        
                        if (result.isNew) {
                            newUploads++;
                            usedAvatars.set(assignedAvatar, { url: avatar, hash: avatar_hash });
                            console.log(`   ✅ New avatar uploaded successfully`);
                        } else {
                            reusedImages++;
                            usedAvatars.set(assignedAvatar, { url: avatar, hash: avatar_hash });
                            console.log(`   ♻️ Using existing avatar from database`);
                        }
                    }
                } catch (error) {
                    console.error(`   ❌ Error uploading avatar:`, error.message);
                }
            } else {
                console.warn(`   ⚠️ Avatar file not found, skipping avatar`);
            }

            processedClients.push({
                ...client,
                avatar: avatar,
                avatar_hash: avatar_hash
            });
            
            console.log(`   📝 Client will be saved with avatar: ${avatar ? 'YES' : 'NO'}`);
        }

        // Insert clients into database
        console.log(`\n💾 Saving clients to database...`);
        const createdClients = [];
        for (const client of processedClients) {
            try {
                const newClient = new clientModel(client);
                await newClient.save();
                createdClients.push(newClient);
            } catch (error) {
                console.error(`❌ Error creating client ${client.firstName} ${client.lastName}:`, error.message);
            }
        }

        console.log(`\n🎉 Successfully seeded ${createdClients.length} clients!`);
        console.log(`📊 Clients with avatars: ${createdClients.filter(c => c.avatar).length}`);
        console.log(`📊 Clients without avatars: ${createdClients.filter(c => !c.avatar).length}`);
        console.log(`📊 New uploads to Cloudinary: ${newUploads}`);
        console.log(`📊 Reused images: ${reusedImages}`);
        
        // Show gender breakdown
        const maleCount = createdClients.filter(c => c.gender === 'male').length;
        const femaleCount = createdClients.filter(c => c.gender === 'female').length;
        console.log(`📊 Male clients: ${maleCount}`);
        console.log(`📊 Female clients: ${femaleCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error in seedClients:", error);
        process.exit(1);
    }
};

seedClients();