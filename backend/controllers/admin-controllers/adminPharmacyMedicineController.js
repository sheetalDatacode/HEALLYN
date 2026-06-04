const asyncHandler = require('../../middleware/asyncHandler');
const Medicine = require('../../models/Medicine');
const Pharmacy = require('../../models/Pharmacy');

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

// GET /api/admin/pharmacy-medicines
exports.getPharmacyMedicines = asyncHandler(async (req, res) => {
  const { pharmacy, search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { isActive: true };
  if (pharmacy) filter.pharmacyId = pharmacy;

  const searchFilter = buildSearchFilter(search, ['name', 'dosage', 'manufacturer']);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [medicines, total] = await Promise.all([
    Medicine.find(finalFilter)
      .populate('pharmacyId', 'pharmacyName address')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Medicine.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
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

// GET /api/admin/pharmacy-medicines/:id
exports.getPharmacyMedicineById = asyncHandler(async (req, res) => {
  const { id: medicineId } = req.params;

  const medicine = await Medicine.findById(medicineId)
    .populate('pharmacyId', 'pharmacyName address contactPerson');

  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: medicine,
  });
});

// PATCH /api/admin/pharmacy-medicines/:id
exports.updatePharmacyMedicine = asyncHandler(async (req, res) => {
  const { id: medicineId } = req.params;
  const updateData = req.body;

  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found',
    });
  }

  Object.assign(medicine, updateData);
  await medicine.save();

  return res.status(200).json({
    success: true,
    message: 'Medicine updated successfully',
    data: medicine,
  });
});

