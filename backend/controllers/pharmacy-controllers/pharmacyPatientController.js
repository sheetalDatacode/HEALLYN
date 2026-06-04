const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Patient = require('../../models/Patient');

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

// GET /api/pharmacy/patients
exports.getPatients = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Get distinct patient IDs from orders
  const patientIds = await Order.distinct('patientId', {
    providerId: id,
    providerType: 'pharmacy',
  });

  const filter = { _id: { $in: patientIds } };
  const searchFilter = buildSearchFilter(search, ['firstName', 'lastName', 'email', 'phone']);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [patients, total] = await Promise.all([
    Patient.find(finalFilter)
      .select('firstName lastName email phone profileImage address')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(finalFilter),
  ]);

  // Get order statistics for each patient
  const patientIdsArray = patients.map(p => p._id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Aggregate order statistics for each patient
  const orderStats = await Order.aggregate([
    {
      $match: {
        providerId: id,
        providerType: 'pharmacy',
        patientId: { $in: patientIdsArray },
      },
    },
    {
      $group: {
        _id: '$patientId',
        totalOrders: { $sum: 1 },
        lastOrderDate: { $max: '$createdAt' },
      },
    },
  ]);

  // Create a map for quick lookup
  const statsMap = new Map();
  orderStats.forEach(stat => {
    statsMap.set(stat._id.toString(), {
      totalOrders: stat.totalOrders,
      lastOrderDate: stat.lastOrderDate,
      status: stat.lastOrderDate && new Date(stat.lastOrderDate) >= thirtyDaysAgo ? 'active' : 'inactive',
    });
  });

  // Enrich patients with order statistics
  const enrichedPatients = patients.map(patient => {
    const stats = statsMap.get(patient._id.toString()) || {
      totalOrders: 0,
      lastOrderDate: null,
      status: 'inactive',
    };

    return {
      ...patient.toObject(),
      totalOrders: stats.totalOrders,
      lastOrderDate: stats.lastOrderDate,
      status: stats.status,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      items: enrichedPatients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/pharmacy/patients/:id
exports.getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { patientId } = req.params;

  // Verify patient has orders with this pharmacy
  const order = await Order.findOne({
    providerId: id,
    providerType: 'pharmacy',
    patientId,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no orders with this pharmacy',
    });
  }

  const patient = await Patient.findById(patientId).select('-password');

  // Get patient orders
  const orders = await Order.find({
    providerId: id,
    providerType: 'pharmacy',
    patientId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: {
      patient,
      orders,
    },
  });
});

// GET /api/pharmacy/patients/statistics
exports.getPatientStatistics = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const [totalPatients, activePatients, totalOrders] = await Promise.all([
    Order.distinct('patientId', { providerId: id, providerType: 'pharmacy' }).then(ids => ids.length),
    Order.distinct('patientId', {
      providerId: id,
      providerType: 'pharmacy',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    }).then(ids => ids.length),
    Order.countDocuments({ providerId: id, providerType: 'pharmacy' }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalPatients,
      activePatients,
      totalOrders,
    },
  });
});

