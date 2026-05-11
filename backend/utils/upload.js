// upload.js
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Use memory storage instead of disk storage so buffer is available
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB per file
  },
});

// Middleware to check for duplicates and save to disk
const checkDuplicateAndSave = async (req, res, next) => {
  // Handle both single file (req.file) and multiple files (req.files)
  const isMultipleFiles = req.files && req.files.length > 0;
  const isSingleFile = req.file && !isMultipleFiles;
  
  if (!isMultipleFiles && !isSingleFile) {
    return next();
  }
  
  const uploadsDir = path.join(__dirname, '../uploads'); // Adjust path to uploads directory
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Helper function to process a single file
  const processFile = (file) => {
    // Calculate hash of uploaded file from buffer
    const hash = crypto.createHash('md5');
    hash.update(file.buffer);
    const fileHash = hash.digest('hex');
    
    const files = fs.readdirSync(uploadsDir);
    let duplicateFound = false;
    let existingFileName = null;
    
    // Check existing files for same hash
    for (const existingFile of files) {
      const existingPath = path.join(uploadsDir, existingFile);
      const existingBuffer = fs.readFileSync(existingPath);
      const existingHash = crypto.createHash('md5').update(existingBuffer).digest('hex');
      
      if (existingHash === fileHash) {
        // Duplicate found
        duplicateFound = true;
        existingFileName = existingFile;
        break;
      }
    }
    
    if (duplicateFound) {
      // Use existing file
      return path.join('uploads', existingFileName);
    } else {
      // No duplicate - generate unique filename and save
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const fileName = `${name}-${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Save the file to disk
      fs.writeFileSync(filePath, file.buffer);
      
      return path.join('uploads', fileName);
    }
  };
  
  // Process based on upload type
  if (isMultipleFiles) {
    // Handle multiple files
    const savedPaths = [];
    for (const file of req.files) {
      const savedPath = processFile(file);
      savedPaths.push(savedPath);
    }
    
    // Attach saved files path to req.files
    req.files = req.files.map((file, index) => ({
      ...file,
      path: savedPaths[index],
      buffer: undefined,
    }));
  } else if (isSingleFile) {
    // Handle single file for profile avatar
    const savedPath = processFile(req.file);
    
    // Attach saved path to req.file
    req.file = {
      ...req.file,
      path: savedPath,
      buffer: undefined,
    };
  }
  
  next();
};

module.exports = { upload, checkDuplicateAndSave };
