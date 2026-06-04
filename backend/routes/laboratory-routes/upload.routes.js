const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { uploadImage, uploadPDF } = require('../../middleware/uploadMiddleware');
const { uploadImage: uploadImageService, uploadPDF: uploadPDFService } = require('../../services/fileUploadService');
const asyncHandler = require('../../middleware/asyncHandler');

// Upload profile image
router.post('/profile-image', protect('laboratory'), uploadImage('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded',
    });
  }

  try {
    const result = await uploadImageService(req.file, 'profiles', 'lab_profile');
    
    return res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        path: result.path,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile image',
    });
  }
}));

// Upload lab report PDF
router.post('/report', protect('laboratory'), uploadPDF('pdf'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PDF file uploaded',
    });
  }

  try {
    const result = await uploadPDFService(req.file, 'reports', 'lab_report');
    
    return res.status(200).json({
      success: true,
      message: 'Lab report uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        path: result.path,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload lab report',
    });
  }
}));

module.exports = router;

