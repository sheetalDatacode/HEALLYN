const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getLaboratoryProfile,
  updateLaboratoryProfile,
} = require('../../controllers/laboratory-controllers/laboratoryProfileController');

router.get('/me', protect('laboratory'), getLaboratoryProfile);
router.patch('/me', protect('laboratory'), updateLaboratoryProfile);

module.exports = router;

