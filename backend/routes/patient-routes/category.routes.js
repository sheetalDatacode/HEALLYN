const express = require('express');
const router = express.Router();
const DoctorCategory = require('../../models/DoctorCategory');
const asyncHandler = require('../../middleware/asyncHandler');

// GET /api/categories (Public route)
router.get('/', asyncHandler(async (req, res) => {
  const categories = await DoctorCategory.find({ isActive: true })
    .select('name image')
    .sort({ name: 1 });

  return res.status(200).json({
    success: true,
    data: categories,
  });
}));

module.exports = router;
