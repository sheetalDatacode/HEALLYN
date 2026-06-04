const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'upload');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow PDFs
  else if (file.mimetype === 'application/pdf') {
    cb(null, true);
  }
  // Allow documents
  else if (
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  }
  // Reject other files
  else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple files upload
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for multiple fields
const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Middleware for image only
const uploadImage = (fieldName = 'image') => {
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed.'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for images
    },
  }).single(fieldName);
};

// Middleware for PDF only
const uploadPDF = (fieldName = 'pdf') => {
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed.'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
    },
  }).single(fieldName);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadImage,
  uploadPDF,
};

