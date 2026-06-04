const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getDashboardStats,
} = require('../../controllers/pharmacy-controllers/pharmacyDashboardController');

router.get('/stats', protect('pharmacy'), getDashboardStats);

module.exports = router;

