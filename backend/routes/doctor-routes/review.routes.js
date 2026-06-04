const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getDoctorReviews,
  getReviewStats,
} = require('../../controllers/doctor-controllers/doctorReviewController');

// GET /api/doctors/reviews - Get doctor reviews
router.get('/', protect('doctor'), getDoctorReviews);

// GET /api/doctors/reviews/stats - Get review statistics
router.get('/stats', protect('doctor'), getReviewStats);

module.exports = router;

