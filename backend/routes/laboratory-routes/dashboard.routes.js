const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getDashboardStats,
} = require('../../controllers/laboratory-controllers/laboratoryDashboardController');

router.get('/stats', protect('laboratory'), getDashboardStats);

module.exports = router;

