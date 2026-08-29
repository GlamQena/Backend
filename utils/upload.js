const multer = require("multer");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const cloudinary_config = require("../config/connectCloudinary");
const productModel = require("../models/product");
const userModel = require("../models/users/user");
const storeModel = require("../models/users/storeOwner");

cloudinary_config();

// Cloudinary folder structure
const FOLDERS = {
    PRODUCTS: "GlamQena/products",
    USERS: "GlamQena/users",
    STORES: "GlamQena/stores",
};

// Helper to get file hash
const getFileHash = (buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

// Helper to get the appropriate model and field based on folder type
const getModelAndField = (folderType) => {
    switch (folderType) {
        case FOLDERS.PRODUCTS:
            return { model: productModel, field: 'images', hashField: 'images_hashes' };
        case FOLDERS.USERS:
            return { model: userModel, field: 'avatar', hashField: 'avatar_hash' };
        case FOLDERS.STORES:
            return { model: storeModel, field: 'logo', hashField: 'logo_hash' };
        default:
            return { model: null, field: null, hashField: null };
    }
};

// Helper to upload a single file to Cloudinary
const uploadStream = (file, folderType) => {
    return new Promise((resolve, reject) => {
        const fileHash = getFileHash(file.buffer);
        const publicId = `${file.originalname.split('.')[0]}-${Date.now()}-${fileHash.substring(0, 8)}`;
        
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderType,
                allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
                public_id: publicId,
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
};

// Memory storage first (to get buffer)
const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB per file
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
});

/**
 * Middleware to handle duplicate check and upload to Cloudinary
 * @param {string} folderType - One of FOLDERS constants
 * @param {boolean} isMultiple - Whether to handle multiple files
 */
const uploadToCloudinary = (folderType = FOLDERS.PRODUCTS, isMultiple = false) => {
    return async (req, res, next) => {
        try {
            // If no files, skip
            if (!req.file && !req.files) {
                return next();
            }

            // Determine if multiple files
            const isMulti = isMultiple || (req.files && req.files.length > 0);
            const files = isMulti ? req.files : [req.file];

            // Validate folder type
            const validFolders = Object.values(FOLDERS);
            if (!validFolders.includes(folderType)) {
                throw new Error(`Invalid folder type: ${folderType}. Must be one of: ${validFolders.join(', ')}`);
            }

            const { model, field, hashField } = getModelAndField(folderType);
            
            // For products: arrays of URLs and hashes
            const uploadedUrls = [];
            const uploadedHashes = [];
            
            // For single images (user/store)
            let uploadedUrl = null;
            let uploadedHash = null;

            for (const file of files) {
                // Calculate hash of the file
                const fileHash = getFileHash(file.buffer);

                // Check if this image already exists in the database
                let existingUrl = null;
                let existingHash = null;

                if (model && field && hashField) {
                    if (field === 'images') {
                        // For product images - check in images_hashes array
                        const docWithImage = await model.findOne({
                            [hashField]: fileHash
                        });
                        
                        if (docWithImage) {
                            const index = docWithImage[hashField].indexOf(fileHash);
                            if (index !== -1) {
                                existingUrl = docWithImage[field][index];
                                existingHash = docWithImage[hashField][index];
                            }
                        }
                    } else {
                        // For single image fields (avatar, logo)
                        const query = {};
                        query[hashField] = fileHash;
                        
                        const docWithImage = await model.findOne(query);
                        
                        if (docWithImage) {
                            existingUrl = docWithImage[field];
                            existingHash = docWithImage[hashField];
                        }
                    }
                }

                if (existingUrl && existingHash) {
                    // Use existing image
                    if (isMulti) {
                        uploadedUrls.push(existingUrl);
                        uploadedHashes.push(existingHash);
                    } else {
                        uploadedUrl = existingUrl;
                        uploadedHash = existingHash;
                    }
                    continue;
                }

                // No duplicate found - upload to Cloudinary
                const result = await uploadStream(file, folderType);
                
                if (isMulti) {
                    uploadedUrls.push(result.secure_url);
                    uploadedHashes.push(fileHash);
                } else {
                    uploadedUrl = result.secure_url;
                    uploadedHash = fileHash;
                }
            }

            // Attach to request based on upload type
            if (isMulti) {
                req.uploadedUrls = uploadedUrls; // Array of URLs
                req.uploadedHashes = uploadedHashes; // Array of hashes
            } else {
                req.uploadedUrl = uploadedUrl; // Single URL
                req.uploadedHash = uploadedHash; // Single hash
            }

            next();
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            next(error);
        }
    };
};

const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

const deleteImageFromCloudinary = async (url) => {
  if (!url) return null;
  
  try {
    const publicId = extractPublicIdFromUrl(url);
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Image deleted from Cloudinary:", result);
      return result;
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Convenience middleware wrappers for different entity types
const uploadProductImages = uploadToCloudinary(FOLDERS.PRODUCTS, true);
const uploadProductImage = uploadToCloudinary(FOLDERS.PRODUCTS, false);
const uploadUserImage = uploadToCloudinary(FOLDERS.USERS, false);
const uploadStoreImage = uploadToCloudinary(FOLDERS.STORES, false);

module.exports = {
    upload,
    uploadToCloudinary,
    uploadProductImages,
    uploadProductImage,
    uploadUserImage,
    uploadStoreImage,
    extractPublicIdFromUrl,
    deleteImageFromCloudinary,
    FOLDERS,
};