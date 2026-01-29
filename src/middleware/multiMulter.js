const multer = require("multer");


const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

const uploadStudentImages = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadStudentImages,
};
