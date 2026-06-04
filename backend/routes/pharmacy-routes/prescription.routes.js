const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const Prescription = require('../../models/Prescription');
const asyncHandler = require('../../middleware/asyncHandler');

// GET /api/pharmacy/prescriptions
router.get('/', protect('pharmacy'), asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  // Get prescriptions shared with this pharmacy
  const filter = {
    'sharedWith.pharmacyId': id,
    isShared: true,
  };

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { 'medications.name': regex },
      { notes: regex },
    ];
  }

  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
}));

// GET /api/pharmacy/prescriptions/:id
router.get('/:id', protect('pharmacy'), asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    'sharedWith.pharmacyId': id,
    isShared: true,
  })
    .populate('patientId', 'firstName lastName phone address')
    .populate('doctorId', 'firstName lastName specialization licenseNumber')
    .populate('consultationId', 'consultationDate diagnosis');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: prescription,
  });
}));

module.exports = router;

