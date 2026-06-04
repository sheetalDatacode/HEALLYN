const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getPrescriptions,
  getPrescriptionById,
  getReports,
  downloadReport,
  shareReport,
} = require('../../controllers/patient-controllers/patientPrescriptionController');

router.get('/prescriptions', protect('patient'), getPrescriptions);
router.get('/prescriptions/:id', protect('patient'), getPrescriptionById);
router.get('/reports', protect('patient'), getReports);
router.get('/reports/:id/download', protect('patient'), downloadReport);
router.post('/reports/:id/share', protect('patient'), shareReport);

module.exports = router;

