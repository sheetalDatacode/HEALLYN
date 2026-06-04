const asyncHandler = require('../../middleware/asyncHandler');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const Nurse = require('../../models/Nurse');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');
const Request = require('../../models/Request');
const Transaction = require('../../models/Transaction');
const { APPROVAL_STATUS } = require('../../utils/constants');
const { calculateProviderEarning } = require('../../utils/commissionConfig');

// GET /api/admin/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  lastMonthStart.setHours(0, 0, 0, 0);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);
  const thisMonthEnd = new Date(now);
  thisMonthEnd.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    totalDoctors,
    totalPharmacies,
    totalLaboratories,
    totalNurses,
    pendingVerifications,
    totalAppointments,
    totalOrders,
    totalRequests,
    todayAppointments,
    todayOrders,
    thisMonthUsers,
    lastMonthUsers,
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthConsultations,
    lastMonthConsultations,
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Doctor.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Pharmacy.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Laboratory.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Nurse.countDocuments({ status: APPROVAL_STATUS.APPROVED }),
    Promise.all([
      Doctor.countDocuments({ status: APPROVAL_STATUS.PENDING }),
      Pharmacy.countDocuments({ status: APPROVAL_STATUS.PENDING }),
      Laboratory.countDocuments({ status: APPROVAL_STATUS.PENDING }),
      Nurse.countDocuments({ status: APPROVAL_STATUS.PENDING }),
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    Appointment.countDocuments({
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    }),
    Order.countDocuments(),
    Request.countDocuments(),
    Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    }),
    Order.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    // This month users
    Patient.countDocuments({
      isActive: true,
      createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
    }),
    // Last month users
    Patient.countDocuments({
      isActive: true,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    // Total revenue (all time) - Calculate commission from all paid appointments and orders
    (async () => {
      const allAppointments = await Appointment.find({ paymentStatus: 'paid' }).lean();
      const allOrders = await Order.find({ paymentStatus: 'paid' }).lean();
      
      let totalCommission = 0;
      for (const apt of allAppointments) {
        if (apt.fee) {
          const { commission } = calculateProviderEarning(apt.fee, 'doctor');
          totalCommission += commission;
        }
      }
      for (const order of allOrders) {
        if (order.totalAmount) {
          const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
          const { commission } = calculateProviderEarning(order.totalAmount, providerType);
          totalCommission += commission;
        }
      }
      return totalCommission;
    })(),
    // This month revenue - Calculate commission from this month's paid appointments and orders
    (async () => {
      const thisMonthAppointments = await Appointment.find({
        paymentStatus: 'paid',
        $or: [
          { paidAt: { $gte: thisMonthStart, $lte: thisMonthEnd } },
          { $and: [
            { paidAt: { $exists: false } },
            { createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd } }
          ]}
        ]
      }).lean();
      const thisMonthOrders = await Order.find({
        paymentStatus: 'paid',
        createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
      }).lean();
      
      let monthCommission = 0;
      for (const apt of thisMonthAppointments) {
        if (apt.fee) {
          const { commission } = calculateProviderEarning(apt.fee, 'doctor');
          monthCommission += commission;
        }
      }
      for (const order of thisMonthOrders) {
        if (order.totalAmount) {
          const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
          const { commission } = calculateProviderEarning(order.totalAmount, providerType);
          monthCommission += commission;
        }
      }
      return monthCommission;
    })(),
    // Last month revenue - Calculate commission from last month's paid appointments and orders
    (async () => {
      const lastMonthAppointments = await Appointment.find({
        paymentStatus: 'paid',
        $or: [
          { paidAt: { $gte: lastMonthStart, $lte: lastMonthEnd } },
          { $and: [
            { paidAt: { $exists: false } },
            { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }
          ]}
        ]
      }).lean();
      const lastMonthOrders = await Order.find({
        paymentStatus: 'paid',
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }).lean();
      
      let monthCommission = 0;
      for (const apt of lastMonthAppointments) {
        if (apt.fee) {
          const { commission } = calculateProviderEarning(apt.fee, 'doctor');
          monthCommission += commission;
        }
      }
      for (const order of lastMonthOrders) {
        if (order.totalAmount) {
          const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
          const { commission } = calculateProviderEarning(order.totalAmount, providerType);
          monthCommission += commission;
        }
      }
      return monthCommission;
    })(),
    // This month consultations (appointments completed)
    Appointment.countDocuments({
      status: 'completed',
      appointmentDate: { $gte: thisMonthStart, $lte: thisMonthEnd },
    }),
    // Last month consultations
    Appointment.countDocuments({
      status: 'completed',
      appointmentDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalDoctors,
      totalPharmacies,
      totalLaboratories,
      totalNurses,
      pendingVerifications,
      totalAppointments,
      totalOrders,
      totalRequests,
      todayAppointments,
      todayOrders,
      thisMonthUsers,
      lastMonthUsers,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthConsultations,
      lastMonthConsultations,
    },
  });
});

// GET /api/admin/activities
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  // Get recent activities from various models
  // Exclude pending payment appointments - only show paid appointments
  const [recentAppointments, recentOrders, recentRequests, recentVerifications] = await Promise.all([
    Appointment.find({
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .select('+rescheduledAt +rescheduledBy +rescheduleReason') // Include rescheduled fields
      .sort({ createdAt: -1 })
      .limit(limit),
    Order.find()
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit),
    Request.find()
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit),
    Promise.all([
      Doctor.find({ status: APPROVAL_STATUS.PENDING })
        .select('firstName lastName specialization createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Pharmacy.find({ status: APPROVAL_STATUS.PENDING })
        .select('pharmacyName createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Laboratory.find({ status: APPROVAL_STATUS.PENDING })
        .select('labName createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Nurse.find({ status: APPROVAL_STATUS.PENDING })
        .select('firstName lastName qualification createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]).then(results => results.flat()),
  ]);

  // Combine and sort by date
  // For appointments, use cancelledAt if cancelled, otherwise use createdAt
  const activities = [
    ...recentAppointments.map(a => ({ 
      type: 'appointment', 
      data: a, 
      date: a.cancelledAt || a.rescheduledAt || a.createdAt // Use cancelledAt/rescheduledAt for proper ordering
    })),
    ...recentOrders.map(o => ({ type: 'order', data: o, date: o.createdAt })),
    ...recentRequests.map(r => ({ type: 'request', data: r, date: r.createdAt })),
    ...recentVerifications.map(v => ({ type: 'verification', data: v, date: v.createdAt })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  return res.status(200).json({
    success: true,
    data: activities,
  });
});

// GET /api/admin/dashboard/charts
exports.getChartData = asyncHandler(async (req, res) => {
  const now = new Date();
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      monthName: monthNames[date.getMonth()],
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
    });
  }

  // Get revenue data for each month - Calculate commission
  const revenuePromises = months.map(async ({ start, end }) => {
    const monthAppointments = await Appointment.find({
      paymentStatus: 'paid',
      $or: [
        { paidAt: { $gte: start, $lte: end } },
        { $and: [
          { paidAt: { $exists: false } },
          { createdAt: { $gte: start, $lte: end } }
        ]}
      ]
    }).lean();
    
    const monthOrders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: start, $lte: end },
    }).lean();
    
    let monthCommission = 0;
    for (const apt of monthAppointments) {
      if (apt.fee) {
        const { commission } = calculateProviderEarning(apt.fee, 'doctor');
        monthCommission += commission;
      }
    }
    for (const order of monthOrders) {
      if (order.totalAmount) {
        const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
        const { commission } = calculateProviderEarning(order.totalAmount, providerType);
        monthCommission += commission;
      }
    }
    return monthCommission;
  });

  // Get user growth data for each month (cumulative)
  const userGrowthPromises = months.map(({ end }) =>
    Patient.countDocuments({
      isActive: true,
      createdAt: { $lte: end },
    })
  );

  // Get consultations data for each month
  const consultationsPromises = months.map(({ start, end }) =>
    Appointment.countDocuments({
      status: 'completed',
      appointmentDate: { $gte: start, $lte: end },
    })
  );

  const [revenueData, userGrowthData, consultationsData] = await Promise.all([
    Promise.all(revenuePromises),
    Promise.all(userGrowthPromises),
    Promise.all(consultationsPromises),
  ]);

  // Format data for charts - Ensure all values are numbers
  const revenueChart = months.map((month, index) => ({
    month: month.monthName,
    value: typeof revenueData[index] === 'number' ? revenueData[index] : 0,
  }));

  const userGrowthChart = months.map((month, index) => ({
    month: month.monthName,
    users: typeof userGrowthData[index] === 'number' ? userGrowthData[index] : 0,
  }));

  const consultationsChart = months.map((month, index) => ({
    month: month.monthName,
    consultations: typeof consultationsData[index] === 'number' ? consultationsData[index] : 0,
  }));

  return res.status(200).json({
    success: true,
    data: {
      revenue: revenueChart,
      userGrowth: userGrowthChart,
      consultations: consultationsChart,
    },
  });
});

