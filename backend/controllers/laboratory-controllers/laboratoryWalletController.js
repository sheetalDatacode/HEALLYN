const asyncHandler = require('../../middleware/asyncHandler');
const WalletTransaction = require('../../models/WalletTransaction');
const WithdrawalRequest = require('../../models/WithdrawalRequest');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/laboratory/wallet/balance
exports.getWalletBalance = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const mongoose = require('mongoose');
  const labObjectId = mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;

  // Calculate core wallet aggregates (earnings, withdrawals, pending)
  const [
    allEarningsCalc,
    allWithdrawalsCalc,
    pendingWithdrawals,
    currentMonthStart,
    lastMonthStart,
    lastMonthEnd,
  ] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          userId: labObjectId,
          userType: 'laboratory',
          type: 'earning',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
    userId: labObjectId,
    userType: 'laboratory',
          type: 'withdrawal',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WithdrawalRequest.aggregate([
    {
      $match: {
        userId: labObjectId,
        userType: 'laboratory',
        status: { $in: ['pending', 'approved'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
    ]),
    Promise.resolve((() => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    })()),
    Promise.resolve((() => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - 1);
      return date;
    })()),
    Promise.resolve((() => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    })()),
  ]);

  // Derive balances
  const balance = (allEarningsCalc[0]?.total || 0) - (allWithdrawalsCalc[0]?.total || 0);
  const pendingAmount = pendingWithdrawals[0]?.total || 0;
  const availableBalance = Math.max(0, balance - pendingAmount);
  const totalEarnings = allEarningsCalc[0]?.total || 0;
  const totalWithdrawals = allWithdrawalsCalc[0]?.total || 0;

  // Monthly stats and counts
  const [
    thisMonthEarnings,
    lastMonthEarnings,
    thisMonthWithdrawals,
    totalTransactions,
  ] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          userId: labObjectId,
          userType: 'laboratory',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: currentMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: labObjectId,
          userType: 'laboratory',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    WithdrawalRequest.aggregate([
      {
        $match: {
          userId: labObjectId,
          userType: 'laboratory',
          createdAt: { $gte: currentMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).then((result) => result[0]?.total || 0),
    WalletTransaction.countDocuments({ userId: labObjectId, userType: 'laboratory' }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      balance,
      totalBalance: balance,
      availableBalance,
      pendingBalance: pendingAmount,
      pendingWithdrawals: pendingAmount,
      totalEarnings,
      totalWithdrawals,
      thisMonthEarnings,
      thisMonthWithdrawals,
      lastMonthEarnings,
      totalTransactions,
    },
  });
});

// GET /api/laboratory/wallet/earnings
exports.getEarnings = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const mongoose = require('mongoose');
  const labObjectId = mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
  const { dateFrom, dateTo } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {
    userId: labObjectId,
    userType: 'laboratory',
    type: 'earning',
    status: 'completed',
  };

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  // Date helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);

  const currentYearStart = new Date(today.getFullYear(), 0, 1);

  const [earnings, total, totalEarningsAgg, thisMonthEarnings, lastMonthEarnings, thisYearEarnings, todayEarnings] = await Promise.all([
    WalletTransaction.find(filter)
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
    WalletTransaction.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: currentMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: currentYearStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((result) => result[0]?.total || 0),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: earnings,
      totalEarnings: totalEarningsAgg[0]?.total || 0,
      thisMonthEarnings,
      lastMonthEarnings,
      thisYearEarnings,
      todayEarnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/laboratory/wallet/transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const mongoose = require('mongoose');
  const labObjectId = mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
  const { type, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { userId: labObjectId, userType: 'laboratory' };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate('orderId', 'totalAmount status patientId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'patientId',
          select: 'name phone',
        },
      })
      .populate('withdrawalRequestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);

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

// GET /api/laboratory/wallet/withdrawals
exports.getWithdrawals = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const mongoose = require('mongoose');
  // Convert to ObjectId for consistent matching
  const laboratoryObjectId = mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { userId: laboratoryObjectId, userType: 'laboratory' };
  if (status) filter.status = status;

  // Date helpers for aggregations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [withdrawals, total, totalWithdrawalsAgg, thisMonthWithdrawalsAgg] = await Promise.all([
    WithdrawalRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WithdrawalRequest.countDocuments(filter),
    WithdrawalRequest.aggregate([
      {
        $match: {
          userId: laboratoryObjectId,
          userType: 'laboratory',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WithdrawalRequest.aggregate([
      {
        $match: {
          userId: laboratoryObjectId,
          userType: 'laboratory',
          createdAt: { $gte: currentMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).then((result) => result[0]?.total || 0),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: withdrawals,
      totalWithdrawals: totalWithdrawalsAgg[0]?.total || 0,
      thisMonthWithdrawals: thisMonthWithdrawalsAgg,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/laboratory/wallet/withdraw
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { amount, paymentMethod, bankAccount, upiId, walletNumber } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid withdrawal amount',
    });
  }

  // Convert id to ObjectId to ensure proper matching
  const mongoose = require('mongoose');
  const laboratoryObjectId = mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;

  // Calculate balance from all transactions (same logic as getWalletBalance)
  const [allEarningsCalc, allWithdrawalsCalc, pendingWithdrawals] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          userId: laboratoryObjectId,
          userType: 'laboratory',
          type: 'earning',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: laboratoryObjectId,
          userType: 'laboratory',
          type: 'withdrawal',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    WithdrawalRequest.aggregate([
      {
        $match: {
          userId: laboratoryObjectId,
          userType: 'laboratory',
          status: { $in: ['pending', 'approved'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  // Calculate balance from transactions
  const balance = (allEarningsCalc[0]?.total || 0) - (allWithdrawalsCalc[0]?.total || 0);
  const pendingAmount = pendingWithdrawals[0]?.total || 0;
  const availableBalance = Math.max(0, balance - pendingAmount);

  

  if (amount > availableBalance) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient balance',
    });
  }

  // Validate payment method
  if (paymentMethod === 'bank' && (!bankAccount || !bankAccount.accountNumber || !bankAccount.ifscCode)) {
    return res.status(400).json({
      success: false,
      message: 'Bank account details are required for bank transfer',
    });
  }

  if (paymentMethod === 'upi' && !upiId) {
    return res.status(400).json({
      success: false,
      message: 'UPI ID is required for UPI transfer',
    });
  }

  if (paymentMethod === 'wallet' && !walletNumber) {
    return res.status(400).json({
      success: false,
      message: 'Wallet number is required for wallet transfer',
    });
  }

  // Map paymentMethod to payoutMethod format expected by model
  let payoutMethod = {};
  
  if (paymentMethod === 'bank') {
    payoutMethod = {
      type: 'bank_transfer',
      details: {
        accountNumber: bankAccount?.accountNumber || '',
        ifscCode: bankAccount?.ifscCode || '',
        accountHolderName: bankAccount?.accountHolderName || '',
      },
    };
  } else if (paymentMethod === 'upi') {
    payoutMethod = {
      type: 'upi',
      details: {
        upiId: upiId || '',
      },
    };
  } else if (paymentMethod === 'wallet') {
    payoutMethod = {
      type: 'paytm',
      details: {
        paytmNumber: walletNumber || '',
      },
    };
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method',
    });
  }

  // Create withdrawal request with proper payoutMethod structure
  const withdrawalRequest = await WithdrawalRequest.create({
    userId: id,
    userType: 'laboratory',
    amount,
    payoutMethod,
    status: 'pending',
  });

  // Get laboratory data
  const Laboratory = require('../../models/Laboratory');
  const laboratory = await Laboratory.findById(id);

  // Emit real-time event to admins
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to('admins').emit('withdrawal:requested', {
      withdrawal: await WithdrawalRequest.findById(withdrawalRequest._id)
        .populate('userId', 'labName ownerName email phone'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to laboratory
  try {
    const { sendWithdrawalRequestNotification } = require('../../services/notificationService');
    await sendWithdrawalRequestNotification({
      provider: laboratory,
      withdrawal: withdrawalRequest,
      providerType: 'laboratory',
    }).catch((error) => console.error('Error sending withdrawal request email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Send email notification to admins
  try {
    const { notifyAdminsOfWithdrawalRequest } = require('../../services/adminNotificationService');
    await notifyAdminsOfWithdrawalRequest({
      withdrawal: withdrawalRequest,
      provider: laboratory,
      providerType: 'laboratory',
    }).catch((error) => console.error('Error sending admin withdrawal notification email:', error));
  } catch (error) {
    console.error('Error sending admin email notifications:', error);
  }

  // Create in-app notifications
  try {
    const { createWalletNotification, createAdminNotification } = require('../../services/notificationService');

    // Notify laboratory
    await createWalletNotification({
      userId: id,
      userType: 'laboratory',
      amount,
      eventType: 'withdrawal_requested',
      withdrawal: withdrawalRequest,
    }).catch((error) => console.error('Error creating laboratory withdrawal notification:', error));

    // Notify all admins
    const Admin = require('../../models/Admin');
    const admins = await Admin.find({});
    
    for (const admin of admins) {
      await createAdminNotification({
        userId: admin._id,
        userType: 'admin',
        eventType: 'withdrawal_requested',
        data: {
          withdrawalId: withdrawalRequest._id,
          providerId: id,
          providerType: 'laboratory',
          providerName: laboratory.labName,
          providerEmail: laboratory.email,
          providerPhone: laboratory.phone,
          amount,
          payoutMethod: {
            type: payoutMethod.type,
            details: payoutMethod.details,
          },
          requestDate: withdrawalRequest.createdAt,
        },
        actionUrl: `/admin/wallet/withdrawals/${withdrawalRequest._id}`,
      }).catch((error) => console.error('Error creating admin withdrawal notification:', error));
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Withdrawal request submitted successfully',
    data: withdrawalRequest,
  });
});

