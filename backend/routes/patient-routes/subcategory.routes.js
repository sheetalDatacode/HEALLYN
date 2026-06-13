const express = require('express');
const router = express.Router();
const DoctorSubcategory = require('../../models/DoctorSubcategory');
const asyncHandler = require('../../middleware/asyncHandler');

// GET /api/subcategories (Public route)
router.get('/', asyncHandler(async (req, res) => {
  const filter = { isActive: true, isApproved: true };
  
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const subcategories = await DoctorSubcategory.find(filter)
    .populate('category', 'name')
    .select('name image category')
    .sort({ name: 1 });

  return res.status(200).json({
    success: true,
    data: subcategories,
  });
}));

module.exports = router;
