const express = require('express');
const router = express.Router();
const Pharmacy = require('../../models/Pharmacy');
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

// GET /api/pharmacies (Public route for discovery)
router.get('/', asyncHandler(async (req, res) => {
  const { search, deliveryOption, city, state, approvedOnly } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { isActive: true };
  if (approvedOnly !== 'false') {
    filter.status = APPROVAL_STATUS.APPROVED;
  }
  if (deliveryOption) {
    filter.deliveryOptions = { $in: [deliveryOption] };
  }
  if (city) filter['address.city'] = new RegExp(city.trim(), 'i');
  if (state) filter['address.state'] = new RegExp(state.trim(), 'i');

  const searchFilter = buildSearchFilter(search, [
    'pharmacyName',
    'address.city',
    'address.state',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find(finalFilter)
      .select('pharmacyName address deliveryOptions rating profileImage')
      .sort({ rating: -1, pharmacyName: 1 })
      .skip(skip)
      .limit(limit),
    Pharmacy.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: pharmacies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
}));

// GET /api/pharmacies/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pharmacy = await Pharmacy.findById(id).select('-password');

  if (!pharmacy || !pharmacy.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: pharmacy,
  });
}));

module.exports = router;

