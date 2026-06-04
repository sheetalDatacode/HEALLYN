const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getPharmacyProfile,
  updatePharmacyProfile,
} = require('../../controllers/pharmacy-controllers/pharmacyProfileController');

router.get('/me', protect('pharmacy'), getPharmacyProfile);
router.patch('/me', protect('pharmacy'), updatePharmacyProfile);

module.exports = router;

