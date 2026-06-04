const express = require('express');
const {
  getDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
  getPharmacies,
  getPharmacyById,
  verifyPharmacy,
  rejectPharmacy,
  getLaboratories,
  getLaboratoryById,
  verifyLaboratory,
  rejectLaboratory,
  getNurses,
  getNurseById,
  verifyNurse,
  rejectNurse,
  getPendingVerifications,
} = require('../../controllers/admin-controllers/adminProviderController');
const { protect } = require('../../middleware/authMiddleware');
const { sanitizeInput } = require('../../middleware/validationMiddleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

// All routes in this file are admin-protected
router.use(protect(ROLES.ADMIN));

// Doctors management
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);
router.patch('/doctors/:id/verify', sanitizeInput, verifyDoctor);
router.patch('/doctors/:id/reject', sanitizeInput, rejectDoctor);

// Pharmacies management
router.get('/pharmacies', getPharmacies);
router.get('/pharmacies/:id', getPharmacyById);
router.patch('/pharmacies/:id/verify', sanitizeInput, verifyPharmacy);
router.patch('/pharmacies/:id/reject', sanitizeInput, rejectPharmacy);

// Laboratories management
router.get('/laboratories', getLaboratories);
router.get('/laboratories/:id', getLaboratoryById);
router.patch('/laboratories/:id/verify', sanitizeInput, verifyLaboratory);
router.patch('/laboratories/:id/reject', sanitizeInput, rejectLaboratory);

// Nurses management
router.get('/nurses', getNurses);
router.get('/nurses/:id', getNurseById);
router.patch('/nurses/:id/verify', sanitizeInput, verifyNurse);
router.patch('/nurses/:id/reject', sanitizeInput, rejectNurse);

// Pending verifications overview
router.get('/verifications/pending', getPendingVerifications);

module.exports = router;


