const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getPharmacyInventory,
  getLaboratoryInventory,
  getPharmacyMedicines,
  getLaboratoryTests,
} = require('../../controllers/admin-controllers/adminInventoryController');

router.get('/pharmacies', protect('admin'), authorize('admin'), getPharmacyInventory);
router.get('/laboratories', protect('admin'), authorize('admin'), getLaboratoryInventory);
router.get('/pharmacies/:id', protect('admin'), authorize('admin'), getPharmacyMedicines);
router.get('/laboratories/:id', protect('admin'), authorize('admin'), getLaboratoryTests);

module.exports = router;

