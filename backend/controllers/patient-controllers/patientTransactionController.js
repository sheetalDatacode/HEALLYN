const asyncHandler = require('../../middleware/asyncHandler');
const Transaction = require('../../models/Transaction');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/patients/transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { type, category, status, dateFrom, dateTo } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { userId: id, userType: 'patient' };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate({
        path: 'appointmentId',
        select: 'fee status doctorId',
        populate: {
          path: 'doctorId',
          select: 'firstName lastName specialization',
        },
      })
      .populate({
        path: 'orderId',
        select: 'totalAmount status providerId providerType',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  // Manually populate providerId for orders based on providerType
  const Pharmacy = require('../../models/Pharmacy');
  const Laboratory = require('../../models/Laboratory');
  
  for (const transaction of transactions) {
    if (transaction.orderId && transaction.orderId.providerId && transaction.orderId.providerType) {
      try {
        if (transaction.orderId.providerType === 'pharmacy') {
          const pharmacy = await Pharmacy.findById(transaction.orderId.providerId).select('pharmacyName name');
          if (pharmacy) {
            transaction.orderId.providerId = {
              _id: pharmacy._id,
              name: pharmacy.pharmacyName || pharmacy.name,
              labName: null,
            };
          }
        } else if (transaction.orderId.providerType === 'laboratory') {
          const laboratory = await Laboratory.findById(transaction.orderId.providerId).select('labName name');
          if (laboratory) {
            transaction.orderId.providerId = {
              _id: laboratory._id,
              name: laboratory.name || null,
              labName: laboratory.labName,
            };
          }
        }
      } catch (error) {
        console.error('Error populating provider:', error);
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      items: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/transactions/:id
exports.getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { transactionId } = req.params;

  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId: id,
    userType: 'patient',
  })
    .populate('orderId')
    .populate('appointmentId');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: transaction,
  });
});

// GET /api/patients/history
exports.getHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const [prescriptions, reports, appointments] = await Promise.all([
    require('../../models/Prescription').find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(10),
    require('../../models/LabReport').find({ patientId: id })
      .populate('laboratoryId', 'labName')
      .sort({ createdAt: -1 })
      .limit(10),
    require('../../models/Appointment').find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 })
      .limit(10),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      prescriptions,
      reports,
      appointments,
    },
  });
});

