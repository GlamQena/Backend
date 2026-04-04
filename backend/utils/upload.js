const multer = require("multer");
const path = require("path"); 

const storage = multer.diskStorage({
  destination: "uploads",
  filename(req, file, callback) {

    const ext =path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);

    const fileName = `${name}-${Date.now()}.${ext}`;
    
    console.log(file.originalname);
    callback(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

module.exports = upload;
