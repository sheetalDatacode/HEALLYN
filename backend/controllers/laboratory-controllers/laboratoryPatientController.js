const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Patient = require('../../models/Patient');
const LabReport = require('../../models/LabReport');

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

// GET /api/laboratory/patients
exports.getPatients = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Get distinct patient IDs from orders
  const patientIds = await Order.distinct('patientId', {
    providerId: id,
    providerType: 'laboratory',
  });

  const filter = { _id: { $in: patientIds } };
  const searchFilter = buildSearchFilter(search, ['firstName', 'lastName', 'email', 'phone']);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [patients, total] = await Promise.all([
    Patient.find(finalFilter)
      .select('firstName lastName email phone profileImage dateOfBirth gender')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/laboratory/patients/:id
exports.getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { patientId } = req.params;

  // Verify patient has orders with this laboratory
  const order = await Order.findOne({
    providerId: id,
    providerType: 'laboratory',
    patientId,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no orders with this laboratory',
    });
  }

  const patient = await Patient.findById(patientId).select('-password');

  return res.status(200).json({
    success: true,
    data: patient,
  });
});

// GET /api/laboratory/patients/:id/orders
exports.getPatientOrders = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { patientId } = req.params;

  const orders = await Order.find({
    providerId: id,
    providerType: 'laboratory',
    patientId,
  })
    .populate('prescriptionId')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: orders,
  });
});

// GET /api/laboratory/patients/statistics
exports.getPatientStatistics = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const [totalPatients, activePatients, totalOrders, totalReports] = await Promise.all([
    Order.distinct('patientId', { providerId: id, providerType: 'laboratory' }).then(ids => ids.length),
    Order.distinct('patientId', {
      providerId: id,
      providerType: 'laboratory',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).then(ids => ids.length),
    Order.countDocuments({ providerId: id, providerType: 'laboratory' }),
    LabReport.countDocuments({ laboratoryId: id }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalPatients,
      activePatients,
      totalOrders,
      totalReports,
    },
  });
});

