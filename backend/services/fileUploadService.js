const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Base upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'upload');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'images'),
    path.join(UPLOAD_DIR, 'documents'),
    path.join(UPLOAD_DIR, 'prescriptions'),
    path.join(UPLOAD_DIR, 'reports'),
    path.join(UPLOAD_DIR, 'profiles'),
    path.join(UPLOAD_DIR, 'licenses'),
    path.join(UPLOAD_DIR, 'temporary'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      
    }
  });
};

// Initialize directories on module load
ensureUploadDirs();

/**
 * Get file extension from filename or mimetype
 */
const getFileExtension = (filename, mimetype) => {
  if (filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext) return ext;
  }
  if (mimetype) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    return mimeToExt[mimetype] || '';
  }
  return '';
};

/**
 * Generate unique filename
 */
const generateFileName = (originalName, mimetype, prefix = '') => {
  const ext = getFileExtension(originalName, mimetype);
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  const name = prefix ? `${prefix}_${timestamp}_${uniqueId}${ext}` : `${timestamp}_${uniqueId}${ext}`;
  return name;
};

/**
 * Upload file to local storage
 * @param {Object} file - File object from multer (req.file)
 * @param {String} folder - Subfolder in upload directory (e.g., 'images', 'documents')
 * @param {String} prefix - Optional prefix for filename
 * @returns {Promise<Object>} Upload result with URL and path
 */
const uploadFile = async (file, folder = 'temporary', prefix = '') => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    // Determine folder path
    const folderPath = path.join(UPLOAD_DIR, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Generate unique filename
    const fileName = generateFileName(file.originalname, file.mimetype, prefix);
    const filePath = path.join(folderPath, fileName);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL (relative path from upload directory)
    const relativePath = path.join(folder, fileName).replace(/\\/g, '/');
    const fileUrl = `/uploads/${relativePath}`;

    return {
      success: true,
      url: fileUrl,
      path: relativePath,
      fileName,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      folder,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload image file
 * @param {Object} file - File object from multer
 * @param {String} folder - Subfolder (default: 'images')
 * @param {String} prefix - Optional prefix
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (file, folder = 'images', prefix = '') => {
  if (!file) {
    throw new Error('No image file provided');
  }

  // Validate image mimetype
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid image format. Allowed: JPEG, PNG, GIF, WebP');
  }

  return uploadFile(file, folder, prefix);
};

/**
 * Upload PDF document
 * @param {Object} file - File object from multer
 * @param {String} folder - Subfolder (default: 'documents')
 * @param {String} prefix - Optional prefix
 * @returns {Promise<Object>} Upload result
 */
const uploadPDF = async (file, folder = 'documents', prefix = '') => {
  if (!file) {
    throw new Error('No PDF file provided');
  }

  // Validate PDF mimetype
  if (file.mimetype !== 'application/pdf') {
    throw new Error('Invalid file format. Only PDF files are allowed.');
  }

  return uploadFile(file, folder, prefix);
};

/**
 * Upload file from buffer
 * @param {Buffer} buffer - File buffer
 * @param {String} originalName - Original filename
 * @param {String} mimetype - File mimetype
 * @param {String} folder - Subfolder
 * @param {String} prefix - Optional prefix
 * @returns {Promise<Object>} Upload result
 */
const uploadFromBuffer = async (buffer, originalName, mimetype, folder = 'temporary', prefix = '') => {
  if (!buffer) {
    throw new Error('No file buffer provided');
  }

  const file = {
    buffer,
    originalname: originalName,
    mimetype,
    size: buffer.length,
  };

  return uploadFile(file, folder, prefix);
};

/**
 * Delete file from local storage
 * @param {String} filePath - Relative path from upload directory (e.g., 'images/photo.jpg')
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (filePath) => {
  if (!filePath) {
    throw new Error('File path is required');
  }

  try {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Construct full path
    const fullPath = path.join(UPLOAD_DIR, cleanPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        message: 'File not found',
      };
    }

    // Delete file
    fs.unlinkSync(fullPath);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get file URL from path
 * @param {String} filePath - Relative path from upload directory
 * @returns {String} File URL
 */
const getFileUrl = (filePath) => {
  if (!filePath) {
    return null;
  }

  // If already a URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Return relative URL
  return `/uploads/${cleanPath}`;
};

/**
 * Check if file exists
 * @param {String} filePath - Relative path from upload directory
 * @returns {Boolean} True if file exists
 */
const fileExists = (filePath) => {
  if (!filePath) {
    return false;
  }

  try {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(UPLOAD_DIR, cleanPath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
};

/**
 * Get file stats
 * @param {String} filePath - Relative path from upload directory
 * @returns {Object} File stats
 */
const getFileStats = (filePath) => {
  if (!filePath) {
    return null;
  }

  try {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(UPLOAD_DIR, cleanPath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch (error) {
    console.error('Get file stats error:', error);
    return null;
  }
};

module.exports = {
  uploadFile,
  uploadImage,
  uploadPDF,
  uploadFromBuffer,
  deleteFile,
  getFileUrl,
  fileExists,
  getFileStats,
  UPLOAD_DIR,
};
