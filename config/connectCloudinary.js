const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloudinary_config = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('Cloudinary connected successfully');
        return cloudinary;
    } catch (error) {
        console.error('Cloudinary connection error:', error);
        throw error;
    }
};

module.exports = cloudinary_config;