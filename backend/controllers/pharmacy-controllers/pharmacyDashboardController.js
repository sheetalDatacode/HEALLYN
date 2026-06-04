const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Medicine = require('../../models/Medicine');
const Patient = require('../../models/Patient');
const WalletTransaction = require('../../models/WalletTransaction');
const Prescription = require('../../models/Prescription');

// GET /api/pharmacy/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Calculate month start and end
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);

  const [
    totalOrders,
    todayOrders,
    totalMedicines,
    totalPatients,
    activePatients,
    inactivePatients,
    totalEarnings,
    todayEarnings,
    thisMonthEarnings,
    lastMonthEarnings,
    pendingPrescriptions,
  ] = await Promise.all([
    Order.countDocuments({ providerId: id, providerType: 'pharmacy' }),
    Order.countDocuments({
      providerId: id,
      providerType: 'pharmacy',
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    Medicine.countDocuments({ pharmacyId: id, isActive: true }),
    Order.distinct('patientId', { providerId: id, providerType: 'pharmacy' }).then(ids => ids.length),
    // Active patients (patients with orders in last 30 days)
    Order.distinct('patientId', {
      providerId: id,
      providerType: 'pharmacy',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).then(ids => ids.length),
    // Inactive patients (patients with no orders in last 30 days)
    Order.distinct('patientId', {
      providerId: id,
      providerType: 'pharmacy',
      createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).then(ids => ids.length),
    WalletTransaction.aggregate([
      { $match: { userId: id, userType: 'pharmacy', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: id,
          userType: 'pharmacy',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: today },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // This month earnings
    WalletTransaction.aggregate([
      {
        $match: {
          userId: id,
          userType: 'pharmacy',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: currentMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // Last month earnings
    WalletTransaction.aggregate([
      {
        $match: {
          userId: id,
          userType: 'pharmacy',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // Pending prescriptions (prescriptions shared with this pharmacy but not fulfilled)
    Prescription.countDocuments({
      'sharedWith.pharmacyId': id,
      status: 'active',
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalOrders,
      todayOrders,
      totalMedicines,
      totalPatients,
      activePatients,
      inactivePatients,
      totalEarnings,
      todayEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      pendingPrescriptions,
    },
  });
});

