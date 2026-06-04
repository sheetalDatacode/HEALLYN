const asyncHandler = require('../../middleware/asyncHandler');
const Medicine = require('../../models/Medicine');

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

// GET /api/pharmacy/medicines
exports.getMedicines = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { pharmacyId: id, isActive: true };
  const searchFilter = buildSearchFilter(search, ['name', 'dosage', 'manufacturer']);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [medicines, total] = await Promise.all([
    Medicine.find(finalFilter)
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

// POST /api/pharmacy/medicines
exports.addMedicine = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { name, dosage, manufacturer, quantity, price, expiryDate, batchNumber, category, prescriptionRequired } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Medicine name and price are required',
    });
  }

  const medicine = await Medicine.create({
    pharmacyId: id,
    name,
    dosage,
    manufacturer,
    quantity: quantity || 0,
    price,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    batchNumber,
    category,
    prescriptionRequired: prescriptionRequired || false,
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    message: 'Medicine added successfully',
    data: medicine,
  });
});

// PATCH /api/pharmacy/medicines/:id
exports.updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { medicineId } = req.params;
  const updateData = req.body;

  const medicine = await Medicine.findOne({
    _id: medicineId,
    pharmacyId: id,
  });

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

// DELETE /api/pharmacy/medicines/:id
exports.deleteMedicine = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { medicineId } = req.params;

  const medicine = await Medicine.findOne({
    _id: medicineId,
    pharmacyId: id,
  });

  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found',
    });
  }

  // Soft delete
  medicine.isActive = false;
  await medicine.save();

  return res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully',
  });
});

