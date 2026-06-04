const express = require('express');
const router = express.Router();
const Laboratory = require('../../models/Laboratory');
const asyncHandler = require('../../middleware/asyncHandler');
const { APPROVAL_STATUS } = require('../../utils/constants');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !search.trim() || !fields.length) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// GET /api/laboratories (Public route for discovery)
router.get('/', asyncHandler(async (req, res) => {
  const { search, city, state, approvedOnly } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { isActive: true };
  if (approvedOnly !== 'false') {
    filter.status = APPROVAL_STATUS.APPROVED;
  }
  if (city) filter['address.city'] = new RegExp(city.trim(), 'i');
  if (state) filter['address.state'] = new RegExp(state.trim(), 'i');

  const searchFilter = buildSearchFilter(search, [
    'labName',
    'address.city',
    'address.state',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [laboratories, total] = await Promise.all([
    Laboratory.find(finalFilter)
      .select('labName address rating profileImage')
      .sort({ rating: -1, labName: 1 })
      .skip(skip)
      .limit(limit),
    Laboratory.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: laboratories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
}));

// GET /api/laboratories/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const laboratory = await Laboratory.findById(id).select('-password');

  if (!laboratory || !laboratory.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: laboratory,
  });
}));

module.exports = router;

