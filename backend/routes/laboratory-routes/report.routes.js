const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { uploadPDF } = require('../../middleware/uploadMiddleware');
const {
  getReports,
  createReport,
  getReportById,
  updateReport,
} = require('../../controllers/laboratory-controllers/laboratoryReportController');

router.get('/', protect('laboratory'), getReports);
router.post('/', protect('laboratory'), uploadPDF('pdf'), createReport);
router.get('/:id', protect('laboratory'), getReportById);
router.patch('/:id', protect('laboratory'), updateReport);

module.exports = router;

