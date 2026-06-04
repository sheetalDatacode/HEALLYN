const asyncHandler = require('../../middleware/asyncHandler');
const Medicine = require('../../models/Medicine');
const Test = require('../../models/Test');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/inventory/pharmacies
exports.getPharmacyInventory = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { isActive: true };
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { pharmacyName: regex },
      { 'address.city': regex },
      { 'address.state': regex },
    ];
  }

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find(filter)
      .select('pharmacyName address')
      .sort({ pharmacyName: 1 })
      .skip(skip)
      .limit(limit),
    Pharmacy.countDocuments(filter),
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
});

// GET /api/admin/inventory/laboratories
exports.getLaboratoryInventory = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const { APPROVAL_STATUS } = require('../../utils/constants');
  
  const filter = { 
    isActive: true,
    status: APPROVAL_STATUS.APPROVED, // Only show approved laboratories
  };
  
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { labName: regex },
      { 'address.city': regex },
      { 'address.state': regex },
      { phone: regex },
      { email: regex },
    ];
  }

  

  const [laboratories, total] = await Promise.all([
    Laboratory.find(filter)
      .select('labName address phone email status isActive rating')
      .sort({ labName: 1 })
      .skip(skip)
      .limit(limit),
    Laboratory.countDocuments(filter),
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
});

// GET /api/admin/inventory/pharmacies/:id
exports.getPharmacyMedicines = asyncHandler(async (req, res) => {
  const { id: pharmacyId } = req.params;
  const { page, limit, skip } = buildPagination(req);

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found',
    });
  }

  const [medicines, total] = await Promise.all([
    Medicine.find({ pharmacyId, isActive: true })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Medicine.countDocuments({ pharmacyId, isActive: true }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      pharmacy: {
        _id: pharmacy._id,
        pharmacyName: pharmacy.pharmacyName,
      },
      items: medicines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/inventory/laboratories/:id
exports.getLaboratoryTests = asyncHandler(async (req, res) => {
  const { id: laboratoryId } = req.params;
  const { page, limit, skip } = buildPagination(req);

  const laboratory = await Laboratory.findById(laboratoryId);
  if (!laboratory) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found',
    });
  }

  const [tests, total] = await Promise.all([
    Test.find({ laboratoryId, isActive: true })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Test.countDocuments({ laboratoryId, isActive: true }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      laboratory: {
        _id: laboratory._id,
        labName: laboratory.labName,
      },
      items: tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

