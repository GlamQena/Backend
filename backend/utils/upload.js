const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const cloudinary_config = require("../config/connectCloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const productModel = require("../models/product");
const userModel = require("../models/users/user");

cloudinary_config(); //automatically configure the imported cloudinary before beig used in CloudinaryStorage

// Helper to get file hash
const getFileHash = (buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

// Memory storage first (to get buffer)
const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage, // Store in memory first to check duplicate
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB per file
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
});

// Middleware to handle duplicate check and upload to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
    try {
        // If no files, skip
        if (!req.file && !req.files) {
            return next();
        }
        
        const isMultiple = req.files && req.files.length > 0;
        const files = isMultiple ? req.files : [req.file];
        
        const uploadedUrls = [];
        
        for (const file of files) {
            // Calculate hash of the file
            const fileHash = getFileHash(file.buffer);
            
            // Check if this image already exists in the database
            let existingImage = null;
            
            // Check in products
            const productWithImage = await productModel.findOne({
                'images': { $regex: fileHash, $options: 'i' }
            });
            
            if (productWithImage) {
                existingImage = productWithImage.images.find(img => img.includes(fileHash));
            }
            
            // Check in users if not found
            if (!existingImage) {
                const userWithImage = await userModel.findOne({
                    'image': { $regex: fileHash, $options: 'i' }
                });
                if (userWithImage) {
                    existingImage = userWithImage.image;
                }
            }
            
            if (existingImage) {
                // Use existing URL
                uploadedUrls.push(existingImage);
                continue;
            }
            
            // No duplicate found - upload to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "Glam2ena",
                        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
                        public_id: `${file.originalname.split('.')[0]}-${Date.now()}-${fileHash.substring(0, 8)}`,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                
                // Convert buffer to stream
                const Readable = require('stream').Readable;
                const readableStream = new Readable();
                readableStream.push(file.buffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
            
            uploadedUrls.push(result.secure_url);
        }
        
        // Attach URLs to request
        if (isMultiple) {
            req.uploadedUrls = uploadedUrls;
        } else {
            req.uploadedUrl = uploadedUrls[0];
        }
        
        next();
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        next(error);
    }
};

module.exports = { upload, uploadToCloudinary };