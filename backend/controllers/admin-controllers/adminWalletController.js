const asyncHandler = require('../../middleware/asyncHandler');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const WalletTransaction = require('../../models/WalletTransaction');
const Transaction = require('../../models/Transaction');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const Nurse = require('../../models/Nurse');
const { getIO } = require('../../config/socket');
const { sendWithdrawalStatusUpdateEmail } = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/wallet/overview
exports.getWalletOverview = asyncHandler(async (req, res) => {
  // Get period filter from query (daily, weekly, monthly, yearly, all)
  const { period = 'all' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let dateFilter = {};
  
  if (period === 'daily') {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: todayStart };
  } else if (period === 'weekly') {
    const weekStart = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    weekStart.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday = 0)
    weekStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: weekStart };
  } else if (period === 'monthly') {
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: monthStart };
  } else if (period === 'yearly') {
    const yearStart = new Date(now);
    yearStart.setMonth(0, 1); // January 1st
    yearStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: yearStart };
  }
  // If period is 'all', no date filter is applied

  // Get total earnings from all providers (with date filter if applicable)
  const matchFilter = { userType: 'doctor', type: 'earning', status: 'completed' };
  if (Object.keys(dateFilter).length > 0) {
    matchFilter.createdAt = dateFilter;
  }
  
  const [doctorEarnings, pharmacyEarnings, labEarnings] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      { $match: { ...matchFilter, userType: 'pharmacy' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      { $match: { ...matchFilter, userType: 'laboratory' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
  ]);

  const totalEarnings = doctorEarnings + pharmacyEarnings + labEarnings;

  // Get pending withdrawals (only pending status)
  const pendingWithdrawals = await WithdrawalRequest.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const pendingAmount = pendingWithdrawals[0]?.total || 0;

  // Get approved withdrawals (approved but not yet paid)
  const approvedWithdrawals = await WithdrawalRequest.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const approvedAmount = approvedWithdrawals[0]?.total || 0;

  // Get total paid out withdrawals (paid withdrawals)
  const paidOutWithdrawals = await WithdrawalRequest.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalPaidOut = paidOutWithdrawals[0]?.total || 0;

  // Calculate total commission from appointments and orders directly
  // This is more accurate than using Transaction model
  const Appointment = require('../../models/Appointment');
  const Order = require('../../models/Order');
  const { calculateProviderEarning } = require('../../utils/commissionConfig');
  
  // Build date filter for appointments and orders
  // For appointments and orders, we need to filter by paidAt or createdAt
  let appointmentQuery = { paymentStatus: 'paid' };
  let orderQuery = { paymentStatus: 'paid' };
  
  if (Object.keys(dateFilter).length > 0) {
    // For appointments, use paidAt if exists, otherwise createdAt
    appointmentQuery.$or = [
      { paidAt: dateFilter },
      { $and: [{ paidAt: { $exists: false } }, { createdAt: dateFilter }] }
    ];
    // For orders, use paidAt if exists, otherwise createdAt
    orderQuery.$or = [
      { paidAt: dateFilter },
      { $and: [{ paidAt: { $exists: false } }, { createdAt: dateFilter }] }
    ];
  }
  
  // Get paid appointments and calculate commission (with date filter if applicable)
  const allAppointments = await Appointment.find(appointmentQuery).lean();
  
  let totalCommissionFromAppointments = 0;
  let totalGBVFromAppointments = 0;
  for (const apt of allAppointments) {
    if (apt.fee) {
      const { commission } = calculateProviderEarning(apt.fee, 'doctor');
      totalCommissionFromAppointments += commission;
      totalGBVFromAppointments += apt.fee;
    }
  }
  
  // Get paid orders and calculate commission (with date filter if applicable)
  const allOrders = await Order.find(orderQuery).lean();
  
  let totalCommissionFromOrders = 0;
  let totalGBVFromOrders = 0;
  for (const order of allOrders) {
    if (order.totalAmount) {
      const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
      const { commission } = calculateProviderEarning(order.totalAmount, providerType);
      totalCommissionFromOrders += commission;
      totalGBVFromOrders += order.totalAmount;
    }
  }
  
  // Total commission = commission from appointments + commission from orders
  const totalCommission = totalCommissionFromAppointments + totalCommissionFromOrders;
  const totalPatientPayments = totalGBVFromAppointments + totalGBVFromOrders;

  // Calculate available balance
  // For period filters, available balance should still consider all withdrawals
  // (withdrawals are not filtered by period as they represent committed funds)
  // But if period is not 'all', we show filtered earnings with all-time available balance
  const committedWithdrawals = totalPaidOut + approvedAmount;
  // For period filters, show available balance based on filtered commission
  // but still consider all committed withdrawals
  const availableBalance = Math.max(0, totalCommission - committedWithdrawals);

  // Calculate this month and last month earnings
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(currentMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(currentMonthStart);
  lastMonthEnd.setDate(0);
  lastMonthEnd.setHours(23, 59, 59, 999);

  const [totalTransactions, activeDoctorsCount, activePharmaciesCount, activeLabsCount] = await Promise.all([
    Transaction.countDocuments({ userType: 'patient', type: 'payment', status: 'completed' }),
    Doctor.countDocuments({ status: 'approved', isActive: true }),
    Pharmacy.countDocuments({ status: 'approved', isActive: true }),
    Laboratory.countDocuments({ status: 'approved', isActive: true }),
  ]);

  // Calculate this month and last month commission from appointments and orders
  const thisMonthAppointments = await Appointment.find({
    paymentStatus: 'paid',
    $or: [
      { paidAt: { $gte: currentMonthStart } },
      { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: currentMonthStart } }] }
    ]
  }).lean();
  
  const thisMonthOrders = await Order.find({
    paymentStatus: 'paid',
    $or: [
      { paidAt: { $gte: currentMonthStart } },
      { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: currentMonthStart } }] }
    ]
  }).lean();
  
  let thisMonthCommission = 0;
  for (const apt of thisMonthAppointments) {
    if (apt.fee) {
      const { commission } = calculateProviderEarning(apt.fee, 'doctor');
      thisMonthCommission += commission;
    }
  }
  for (const order of thisMonthOrders) {
    if (order.totalAmount) {
      const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
      const { commission } = calculateProviderEarning(order.totalAmount, providerType);
      thisMonthCommission += commission;
    }
  }
  
  const lastMonthAppointments = await Appointment.find({
    paymentStatus: 'paid',
    $or: [
      { paidAt: { $gte: lastMonthStart, $lte: lastMonthEnd } },
      { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }] }
    ]
  }).lean();
  
  const lastMonthOrders = await Order.find({
    paymentStatus: 'paid',
    $or: [
      { paidAt: { $gte: lastMonthStart, $lte: lastMonthEnd } },
      { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }] }
    ]
  }).lean();
  
  let lastMonthCommission = 0;
  for (const apt of lastMonthAppointments) {
    if (apt.fee) {
      const { commission } = calculateProviderEarning(apt.fee, 'doctor');
      lastMonthCommission += commission;
    }
  }
  for (const order of lastMonthOrders) {
    if (order.totalAmount) {
      const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
      const { commission } = calculateProviderEarning(order.totalAmount, providerType);
      lastMonthCommission += commission;
    }
  }

  

  // Ensure all values are numbers (not NaN or undefined)
  const finalTotalCommission = Number(totalCommission) || 0;
  const finalAvailableBalance = Number(availableBalance) || 0;
  const finalPendingWithdrawals = Number(pendingAmount) || 0;
  const finalApprovedWithdrawals = Number(approvedAmount) || 0;
  const finalTotalPaidOut = Number(totalPaidOut) || 0;

  

  return res.status(200).json({
    success: true,
    data: {
      // Total Platform Earnings = Admin's Commission (filtered by period if specified)
      totalCommission: finalTotalCommission,
      // Available Balance = Commission - Money already paid out - Money approved (committed)
      availableBalance: finalAvailableBalance,
      // Pending = Pending withdrawal requests (not yet approved)
      pendingWithdrawals: finalPendingWithdrawals,
      // Approved = Approved withdrawal requests (committed but not yet paid)
      approvedWithdrawals: finalApprovedWithdrawals,
      // Total paid out to providers
      totalPaidOut: finalTotalPaidOut,
      // Additional data for reference
      totalPatientPayments: Number(totalPatientPayments) || 0,
      totalEarnings: Number(totalEarnings) || 0,
      doctorEarnings: Number(doctorEarnings) || 0,
      pharmacyEarnings: Number(pharmacyEarnings) || 0,
      labEarnings: Number(labEarnings) || 0,
      thisMonthEarnings: Number(thisMonthCommission) || 0,
      lastMonthEarnings: Number(lastMonthCommission) || 0,
      totalTransactions: Number(totalTransactions) || 0,
      activeDoctorsCount: Number(activeDoctorsCount) || 0,
      activePharmaciesCount: Number(activePharmaciesCount) || 0,
      activeLabsCount: Number(activeLabsCount) || 0,
      // Period filter info
      period: period,
      periodEarnings: finalTotalCommission, // Earnings for the selected period
    },
  });
});

// GET /api/admin/wallet/providers
exports.getProviderSummaries = asyncHandler(async (req, res) => {
  const { role, period = 'all' } = req.query;

  // Calculate date range based on period (same logic as getWalletOverview)
  const now = new Date();
  let dateFilter = {};
  
  if (period === 'daily') {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: todayStart };
  } else if (period === 'weekly') {
    const weekStart = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    weekStart.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday = 0)
    weekStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: weekStart };
  } else if (period === 'monthly') {
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: monthStart };
  } else if (period === 'yearly') {
    const yearStart = new Date(now);
    yearStart.setMonth(0, 1); // January 1st
    yearStart.setHours(0, 0, 0, 0);
    dateFilter = { $gte: yearStart };
  }

  const roles = role ? [role] : ['doctor', 'pharmacy', 'laboratory', 'nurse'];
  const summaries = [];

  for (const r of roles) {
    const Model = r === 'doctor' ? Doctor : r === 'pharmacy' ? Pharmacy : r === 'laboratory' ? Laboratory : Nurse;
    const nameField = r === 'doctor' || r === 'nurse' ? 'firstName' : r === 'pharmacy' ? 'pharmacyName' : 'labName';

    const providers = await Model.find({ status: 'approved', isActive: true })
      .select(`${nameField} ${(r === 'doctor' || r === 'nurse') ? 'lastName' : ''} email phone`);

    for (const provider of providers) {
      // Build match filter for earnings with period filter
      const earningsMatchFilter = { 
        userId: provider._id, 
        userType: r, 
        type: 'earning', 
        status: 'completed' 
      };
      
      // Add date filter if period is specified
      if (Object.keys(dateFilter).length > 0) {
        earningsMatchFilter.createdAt = dateFilter;
      }
      
      // Get total earnings (filtered by period if specified)
      const totalEarningsResult = await WalletTransaction.aggregate([
        { $match: earningsMatchFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalEarnings = totalEarningsResult[0]?.total || 0;
      
      // For withdrawals, we still show all-time (not filtered by period)
      // as withdrawals represent committed funds regardless of when earned

      // Get total withdrawals (all completed withdrawal transactions)
      const totalWithdrawalsResult = await WalletTransaction.aggregate([
        { $match: { userId: provider._id, userType: r, type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalWithdrawals = totalWithdrawalsResult[0]?.total || 0;

      // Calculate balance: Total Earnings - Total Withdrawals
      const balance = totalEarnings - totalWithdrawals;

      // Get pending withdrawal amount (only 'pending' status, not 'approved')
      const pendingWithdrawalsResult = await WithdrawalRequest.aggregate([
        { 
          $match: { 
            userId: provider._id, 
            userType: r, 
            status: 'pending' // Only count pending, not approved
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const pendingBalance = pendingWithdrawalsResult[0]?.total || 0;

      // Calculate available balance: Balance - Pending Withdrawals
      const availableBalance = Math.max(0, balance - pendingBalance);

      // Get total wallet transactions count (filtered by period if specified)
      const transactionCountFilter = {
        userId: provider._id,
        userType: r,
      };
      if (Object.keys(dateFilter).length > 0) {
        transactionCountFilter.createdAt = dateFilter;
      }
      const totalTransactions = await WalletTransaction.countDocuments(transactionCountFilter);

      // Calculate period-specific balance
      // For period filters, we show earnings for that period
      // But balance calculation still uses all-time withdrawals (as they're committed funds)
      const periodBalance = totalEarnings - totalWithdrawals;
      const periodAvailableBalance = Math.max(0, periodBalance - pendingBalance);

      

      summaries.push({
        providerId: provider._id,
        providerType: r,
        type: r, // Add 'type' field for frontend compatibility
        role: r, // Add 'role' field for frontend compatibility
        name: (r === 'doctor' || r === 'nurse') ? `${provider.firstName} ${provider.lastName}` : provider[nameField],
        email: provider.email,
        phone: provider.phone,
        balance, // All-time balance = all earnings - all withdrawals
        availableBalance, // All-time available = balance - pending
        totalEarnings, // Period-filtered earnings (or all-time if period='all')
        totalWithdrawals, // All-time withdrawals (not filtered by period)
        pendingBalance, // Pending withdrawal requests
        totalTransactions, // Period-filtered transaction count
        status: 'active',
        period, // Include period in response
        periodEarnings: totalEarnings, // Period-specific earnings
      });
    }
  }

  

  return res.status(200).json({
    success: true,
    data: summaries,
    period, // Include period in response
  });
});

// GET /api/admin/wallet/withdrawals
exports.getWithdrawals = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (status) filter.status = status;
  if (role) filter.userType = role;

  // Fetch withdrawals and populate userId based on userType
  const withdrawals = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for better performance
  
  const total = await WithdrawalRequest.countDocuments(filter);
  
  // Manually populate userId based on userType
  const Doctor = require('../../models/Doctor');
  const Pharmacy = require('../../models/Pharmacy');
  const Laboratory = require('../../models/Laboratory');
  
  for (const withdrawal of withdrawals) {
    if (withdrawal.userId) {
      try {
        if (withdrawal.userType === 'doctor') {
          const doctor = await Doctor.findById(withdrawal.userId)
            .select('firstName lastName email phone')
            .lean();
          if (doctor) {
            withdrawal.userId = doctor;
          }
        } else if (withdrawal.userType === 'pharmacy') {
          const pharmacy = await Pharmacy.findById(withdrawal.userId)
            .select('pharmacyName ownerName email phone')
            .lean();
          if (pharmacy) {
            withdrawal.userId = pharmacy;
          }
        } else if (withdrawal.userType === 'laboratory') {
          const lab = await Laboratory.findById(withdrawal.userId)
            .select('labName ownerName email phone')
            .lean();
          if (lab) {
            withdrawal.userId = lab;
          }
        }
      } catch (error) {
        console.error(`Error populating userId for withdrawal ${withdrawal._id}:`, error.message);
      }
    }
  }
  
  

  return res.status(200).json({
    success: true,
    data: {
      items: withdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// PATCH /api/admin/wallet/withdrawals/:id
exports.updateWithdrawalStatus = asyncHandler(async (req, res) => {
  const { id: withdrawalId } = req.params;
  const { status, adminNote, payoutReference } = req.body;

  const { WITHDRAWAL_STATUS } = require('../../utils/constants');
  const validStatuses = Object.values(WITHDRAWAL_STATUS);
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
    });
  }

  const withdrawal = await WithdrawalRequest.findById(withdrawalId);
  if (!withdrawal) {
    return res.status(404).json({
      success: false,
      message: 'Withdrawal request not found',
    });
  }

  withdrawal.status = status;
  if (adminNote) withdrawal.adminNote = adminNote;
  if (payoutReference) withdrawal.payoutReference = payoutReference;
  if (status === WITHDRAWAL_STATUS.PAID) {
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.auth.id;
  }

  await withdrawal.save();

  // If paid, create wallet transaction for deduction
  if (status === WITHDRAWAL_STATUS.PAID) {
    const WalletTransaction = require('../../models/WalletTransaction');
    const latestTransaction = await WalletTransaction.findOne({
      userId: withdrawal.userId,
      userType: withdrawal.userType,
    }).sort({ createdAt: -1 });

    const currentBalance = latestTransaction?.balance || 0;
    const newBalance = Math.max(0, currentBalance - withdrawal.amount);

    await WalletTransaction.create({
      userId: withdrawal.userId,
      userType: withdrawal.userType,
      type: 'withdrawal',
      amount: withdrawal.amount,
      balance: newBalance,
      status: 'completed',
      description: 'Withdrawal processed',
      referenceId: withdrawal._id.toString(),
      withdrawalRequestId: withdrawal._id,
    });
  }

  // Get provider data for email
  let provider = null;
  if (withdrawal.userType === 'doctor') {
    provider = await Doctor.findById(withdrawal.userId);
  } else if (withdrawal.userType === 'pharmacy') {
    provider = await Pharmacy.findById(withdrawal.userId);
  } else if (withdrawal.userType === 'laboratory') {
    provider = await Laboratory.findById(withdrawal.userId);
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`${withdrawal.userType}-${withdrawal.userId}`).emit('withdrawal:status:updated', {
      withdrawalId: withdrawal._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to provider (only for approved and paid statuses)
  if (provider && (status === 'approved' || status === 'paid')) {
    try {
      const Admin = require('../../models/Admin');
      const admin = await Admin.findById(req.auth.id).select('name email');
      
      // Enhance withdrawal object with admin details for email
      const withdrawalForEmail = {
        ...withdrawal.toObject(),
        adminName: admin?.name || 'Admin',
        adminNote: withdrawal.adminNote,
        payoutReference: withdrawal.payoutReference,
        rejectionReason: withdrawal.rejectionReason,
        payoutMethod: withdrawal.payoutMethod, // Include payout method details
        processedAt: withdrawal.processedAt,
      };

      await sendWithdrawalStatusUpdateEmail({
        provider,
        withdrawal: withdrawalForEmail,
        providerType: withdrawal.userType,
      }).catch((error) => console.error('Error sending withdrawal status update email:', error));
    } catch (error) {
      console.error('Error sending email notifications:', error);
    }
  }

  // Create in-app notifications
  try {
    const { createWalletNotification } = require('../../services/notificationService');
    const Admin = require('../../models/Admin');
    const admin = await Admin.findById(req.auth.id).select('name email');
    
    let eventType = null;
    
    if (status === 'approved') {
      eventType = 'withdrawal_approved';
    } else if (status === 'paid') {
      eventType = 'withdrawal_paid';
    } else if (status === 'rejected') {
      eventType = 'withdrawal_rejected';
    }

    if (eventType && provider) {
      // Enhance withdrawal object with admin details for notification
      const withdrawalWithAdmin = {
        ...withdrawal.toObject(),
        adminName: admin?.name || 'Admin',
        adminId: req.auth.id,
        adminNote: withdrawal.adminNote,
        payoutReference: withdrawal.payoutReference,
        rejectionReason: withdrawal.rejectionReason,
        payoutMethod: withdrawal.payoutMethod, // Include payout method details
        processedAt: withdrawal.processedAt,
      };

      await createWalletNotification({
        userId: withdrawal.userId,
        userType: withdrawal.userType,
        amount: withdrawal.amount,
        eventType,
        withdrawal: withdrawalWithAdmin,
        // Send email only for approved and paid statuses
        sendEmail: status === 'approved' || status === 'paid',
      }).catch((error) => console.error('Error creating withdrawal status notification:', error));
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Withdrawal status updated successfully',
    data: withdrawal,
  });
});

// GET /api/admin/wallet/balance - Get admin wallet balance
exports.getAdminWalletBalance = asyncHandler(async (req, res) => {
  // Get total payments from patients (patient payments are stored with userType: 'patient')
  const patientPayments = await Transaction.aggregate([
    { $match: { userType: 'patient', type: 'payment', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const balance = patientPayments[0]?.total || 0;

  // Get today's payments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = await Transaction.aggregate([
    {
      $match: {
        userType: 'patient',
        type: 'payment',
        status: 'completed',
        createdAt: { $gte: today },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const todayTotal = todayPayments[0]?.total || 0;

  return res.status(200).json({
    success: true,
    data: {
      balance,
      todayTotal,
    },
  });
});

// GET /api/admin/wallet/transactions - Get admin wallet transactions
exports.getAdminWalletTransactions = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Admin should see all patient payment transactions (these are the revenue)
  // Also include admin transactions for commission tracking
  const transactionType = type && type !== 'all' ? type : 'payment';
  
  const baseFilter = {
    $or: [
      { userType: 'patient', type: transactionType, status: 'completed' },
      { userType: 'admin', type: transactionType, status: 'completed' },
    ],
  };
  
  // Build date filter if provided
  const dateFilter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  
  // Combine filters
  const filter = { ...baseFilter };
  if (category) {
    // Add category to each $or condition
    filter.$or = filter.$or.map(condition => ({ ...condition, category }));
  }
  if (Object.keys(dateFilter).length > 0) {
    // Add date filter to each $or condition
    filter.$or = filter.$or.map(condition => ({ ...condition, createdAt: dateFilter }));
  }
  
  

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('appointmentId', 'appointmentDate fee')
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  

  // Enrich transactions with patient information
  const Patient = require('../../models/Patient');
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const transactionObj = transaction.toObject();
      // Get patient from userId (since userType is 'patient' or 'admin')
      if (transaction.userId && transaction.userType === 'patient') {
        const patient = await Patient.findById(transaction.userId)
          .select('firstName lastName phone email');
        if (patient) {
          transactionObj.patient = patient;
          transactionObj.patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        }
      }
      // Also check metadata for patientId (backward compatibility)
      if (!transactionObj.patient && transaction.metadata?.patientId) {
        const patient = await Patient.findById(transaction.metadata.patientId)
          .select('firstName lastName phone email');
        if (patient) {
          transactionObj.patient = patient;
          transactionObj.patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        }
      }
      // For admin transactions, set provider info
      if (transaction.userType === 'admin') {
        transactionObj.providerName = 'Platform';
        transactionObj.providerType = 'admin';
      }
      return transactionObj;
    })
  );

  

  return res.status(200).json({
    success: true,
    data: {
      items: enrichedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

