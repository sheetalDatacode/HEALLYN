const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createReview,
  getReviews,
  getReviewById,
} = require('../../controllers/patient-controllers/patientReviewController');

router.post('/', protect('patient'), createReview);
router.get('/', protect('patient'), getReviews);
router.get('/:id', protect('patient'), getReviewById);

module.exports = router;

