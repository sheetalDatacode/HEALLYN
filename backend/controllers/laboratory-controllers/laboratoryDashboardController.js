const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Test = require('../../models/Test');
const LabReport = require('../../models/LabReport');
const Patient = require('../../models/Patient');
const WalletTransaction = require('../../models/WalletTransaction');
const Request = require('../../models/Request');

// GET /api/laboratory/dashboard/stats
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
    totalTests,
    totalReports,
    totalPatients,
    totalEarnings,
    todayEarnings,
    thisMonthEarnings,
    lastMonthEarnings,
    thisMonthOrders,
    lastMonthOrders,
    requestResponses,
  ] = await Promise.all([
    Order.countDocuments({ providerId: id, providerType: 'laboratory' }),
    Order.countDocuments({
      providerId: id,
      providerType: 'laboratory',
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    Test.countDocuments({ laboratoryId: id, isActive: true }),
    LabReport.countDocuments({ laboratoryId: id }),
    Order.distinct('patientId', { providerId: id, providerType: 'laboratory' }).then(ids => ids.length),
    WalletTransaction.aggregate([
      { $match: { userId: id, userType: 'laboratory', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: id,
          userType: 'laboratory',
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
          userType: 'laboratory',
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
          userType: 'laboratory',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // This month orders
    Order.countDocuments({
      providerId: id,
      providerType: 'laboratory',
      createdAt: { $gte: currentMonthStart },
    }),
    // Last month orders
    Order.countDocuments({
      providerId: id,
      providerType: 'laboratory',
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    // Request responses (requests with adminResponse)
    Request.countDocuments({
      type: 'book_test_visit',
      status: { $in: ['completed', 'confirmed'] },
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalOrders,
      todayOrders,
      totalTests,
      totalReports,
      totalPatients,
      totalEarnings,
      todayEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      thisMonthOrders,
      lastMonthOrders,
      requestResponses,
    },
  });
});

