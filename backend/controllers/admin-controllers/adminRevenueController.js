const asyncHandler = require('../../middleware/asyncHandler');
const Transaction = require('../../models/Transaction');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');
const WalletTransaction = require('../../models/WalletTransaction');
const { calculateProviderEarning } = require('../../utils/commissionConfig');

// Helper function to get date ranges based on period
const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      // All time
      startDate = null;
      endDate = null;
  }

  return { startDate, endDate };
};

// GET /api/admin/revenue?period=today|week|month|year
exports.getRevenueOverview = asyncHandler(async (req, res) => {
  const { period = 'all' } = req.query;
  const { startDate, endDate } = getDateRange(period);

  // Build date filter
  const dateFilter = startDate && endDate 
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : {};

  // Get patient payments (GBV - Gross Booking Value)
  const patientPaymentFilter = {
    userType: 'patient',
    type: 'payment',
    status: 'completed',
    ...dateFilter,
  };

  const [patientPayments, appointments, orders] = await Promise.all([
    // Patient transactions (GBV)
    Transaction.find(patientPaymentFilter)
      .populate('appointmentId', 'doctorId fee appointmentDate')
      .populate('orderId', 'providerId providerType totalAmount')
      .sort({ createdAt: -1 })
      .lean(),

    // Appointments with payments
    Appointment.find({
      paymentStatus: 'paid',
      ...(startDate && endDate ? {
        $or: [
          { paidAt: { $gte: startDate, $lte: endDate } },
          { $and: [
            { paidAt: { $exists: false } },
            { createdAt: { $gte: startDate, $lte: endDate } }
          ]}
        ]
      } : {}),
    })
      .populate('doctorId', 'firstName lastName')
      .populate('patientId', 'firstName lastName')
      .lean(),

    // Orders with payments
    Order.find({
      paymentStatus: 'paid',
      ...(startDate && endDate ? {
        createdAt: { $gte: startDate, $lte: endDate }
      } : {}),
    })
      .populate('providerId')
      .populate('patientId', 'firstName lastName')
      .lean(),
  ]);

  // Calculate totals
  let totalGBV = 0;
  let totalCommission = 0;
  let totalPayout = 0;
  let transactionsCount = 0;

  // Doctor revenue
  let doctorGBV = 0;
  let doctorCommission = 0;
  let doctorPayout = 0;
  let doctorAppointments = 0;

  // Lab revenue
  let labGBV = 0;
  let labCommission = 0;
  let labPayout = 0;
  let labOrders = 0;

  // Pharmacy revenue
  let pharmacyGBV = 0;
  let pharmacyCommission = 0;
  let pharmacyPayout = 0;
  let pharmacyOrders = 0;

  // Process appointments
  for (const appointment of appointments) {
    if (!appointment.fee) continue;

    const gbv = appointment.fee;
    const { commission, earning } = calculateProviderEarning(gbv, 'doctor');

    doctorGBV += gbv;
    doctorCommission += commission;
    doctorPayout += earning;
    doctorAppointments += 1;

    totalGBV += gbv;
    totalCommission += commission;
    totalPayout += earning;
    transactionsCount += 1;
  }

  // Process orders
  for (const order of orders) {
    if (!order.totalAmount) continue;

    const gbv = order.totalAmount;
    const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
    const { commission, earning } = calculateProviderEarning(gbv, providerType);

    if (providerType === 'laboratory') {
      labGBV += gbv;
      labCommission += commission;
      labPayout += earning;
      labOrders += 1;
    } else {
      pharmacyGBV += gbv;
      pharmacyCommission += commission;
      pharmacyPayout += earning;
      pharmacyOrders += 1;
    }

    totalGBV += gbv;
    totalCommission += commission;
    totalPayout += earning;
    transactionsCount += 1;
  }

  // Build transactions list
  const Patient = require('../../models/Patient');
  const Doctor = require('../../models/Doctor');
  const Pharmacy = require('../../models/Pharmacy');
  const Laboratory = require('../../models/Laboratory');

  const transactions = [];

  // Add appointment transactions
  for (const appointment of appointments) {
    if (!appointment.fee) continue;

    const gbv = appointment.fee;
    const { commission, earning } = calculateProviderEarning(gbv, 'doctor');

    const doctor = appointment.doctorId;
    const patient = appointment.patientId;

    transactions.push({
      type: 'Doctor',
      provider: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor',
      patient: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
      gbv,
      commission,
      payout: earning,
      date: appointment.paidAt || appointment.createdAt || new Date(),
      appointments: 1,
      orders: 0,
    });
  }

  // Add order transactions
  for (const order of orders) {
    if (!order.totalAmount) continue;

    const gbv = order.totalAmount;
    const providerType = order.providerType === 'laboratory' ? 'laboratory' : 'pharmacy';
    const { commission, earning } = calculateProviderEarning(gbv, providerType);

    let providerName = 'Unknown Provider';
    if (order.providerId) {
      if (providerType === 'laboratory') {
        const lab = await Laboratory.findById(order.providerId).select('labName').lean();
        providerName = lab ? lab.labName : 'Unknown Lab';
      } else {
        const pharmacy = await Pharmacy.findById(order.providerId).select('pharmacyName').lean();
        providerName = pharmacy ? pharmacy.pharmacyName : 'Unknown Pharmacy';
      }
    }

    const patient = order.patientId;

    transactions.push({
      type: providerType === 'laboratory' ? 'Lab' : 'Pharmacy',
      provider: providerName,
      patient: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
      gbv,
      commission,
      payout: earning,
      date: order.createdAt,
      appointments: 0,
      orders: 1,
    });
  }

  // Sort transactions by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate revenue contribution percentages
  const totalRevenueForPie = doctorCommission + labCommission + pharmacyCommission;
  const pieChartData = [
    {
      label: 'Doctors',
      value: totalRevenueForPie > 0 ? (doctorCommission / totalRevenueForPie) * 100 : 0,
      amount: doctorCommission,
    },
    {
      label: 'Labs',
      value: totalRevenueForPie > 0 ? (labCommission / totalRevenueForPie) * 100 : 0,
      amount: labCommission,
    },
    {
      label: 'Pharmacy',
      value: totalRevenueForPie > 0 ? (pharmacyCommission / totalRevenueForPie) * 100 : 0,
      amount: pharmacyCommission,
    },
  ];

  // Monthly revenue for line chart (last 6 months)
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // Get commission for this month
    const monthAppointments = await Appointment.countDocuments({
      paymentStatus: 'paid',
      $or: [
        { paidAt: { $gte: monthStart, $lte: monthEnd } },
        { $and: [
          { paidAt: { $exists: false } },
          { createdAt: { $gte: monthStart, $lte: monthEnd } }
        ]}
      ]
    });

    const monthAppointmentFees = await Appointment.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          $or: [
            { paidAt: { $gte: monthStart, $lte: monthEnd } },
            { $and: [
              { paidAt: { $exists: false } },
              { createdAt: { $gte: monthStart, $lte: monthEnd } }
            ]}
          ]
        },
      },
      { $group: { _id: null, total: { $sum: '$fee' } } },
    ]);

    const monthOrders = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    let monthCommission = 0;
    if (monthAppointmentFees[0]?.total) {
      const { commission } = calculateProviderEarning(monthAppointmentFees[0].total, 'doctor');
      monthCommission += commission;
    }
    if (monthOrders[0]?.total) {
      // Approximate split (can be improved)
      const { commission: labComm } = calculateProviderEarning(monthOrders[0].total * 0.5, 'laboratory');
      const { commission: pharmComm } = calculateProviderEarning(monthOrders[0].total * 0.5, 'pharmacy');
      monthCommission += labComm + pharmComm;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthlyRevenue.push({
      month: monthNames[monthStart.getMonth()],
      revenue: monthCommission,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      // Summary cards
      totalRevenue: totalCommission,
      totalGBV,
      totalPayouts: totalPayout,
      transactionsCount,

      // Revenue breakdown
      revenueBreakdown: {
        doctor: {
          gbv: doctorGBV,
          commission: doctorCommission,
          payout: doctorPayout,
          appointments: doctorAppointments,
        },
        lab: {
          gbv: labGBV,
          commission: labCommission,
          payout: labPayout,
          orders: labOrders,
        },
        pharmacy: {
          gbv: pharmacyGBV,
          commission: pharmacyCommission,
          payout: pharmacyPayout,
          orders: pharmacyOrders,
        },
      },

      // Charts data
      pieChartData,
      monthlyRevenue,

      // Transactions
      transactions,
    },
  });
});

// GET /api/admin/revenue/providers/:type (doctor|lab|pharmacy)
exports.getProviderRevenue = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { period = 'all' } = req.query;
  const { startDate, endDate } = getDateRange(period);

  if (!['doctor', 'lab', 'pharmacy'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid provider type. Must be doctor, lab, or pharmacy',
    });
  }

  const Doctor = require('../../models/Doctor');
  const Pharmacy = require('../../models/Pharmacy');
  const Laboratory = require('../../models/Laboratory');

  let providers = [];
  let providerSummaries = [];

  if (type === 'doctor') {
    providers = await Doctor.find({ isActive: true })
      .select('firstName lastName email specialty')
      .lean();

    // Get revenue for each doctor
    for (const doctor of providers) {
      const appointmentFilter = {
        doctorId: doctor._id,
        paymentStatus: 'paid',
        ...(startDate && endDate ? {
          $or: [
            { paidAt: { $gte: startDate, $lte: endDate } },
            { $and: [
              { paidAt: { $exists: false } },
              { createdAt: { $gte: startDate, $lte: endDate } }
            ]}
          ]
        } : {}),
      };

      const appointments = await Appointment.find(appointmentFilter).lean();
      
      let gbv = 0;
      let commission = 0;
      let payout = 0;
      let appointmentsCount = 0;

      for (const apt of appointments) {
        if (!apt.fee) continue;
        const { commission: comm, earning } = calculateProviderEarning(apt.fee, 'doctor');
        gbv += apt.fee;
        commission += comm;
        payout += earning;
        appointmentsCount += 1;
      }

      providerSummaries.push({
        id: doctor._id.toString(),
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        email: doctor.email,
        specialty: doctor.specialty,
        gbv,
        commission,
        payout,
        appointments: appointmentsCount,
        transactions: appointmentsCount,
      });
    }
  } else if (type === 'lab') {
    providers = await Laboratory.find({ isActive: true })
      .select('labName email')
      .lean();

    for (const lab of providers) {
      const orderFilter = {
        providerId: lab._id,
        providerType: 'laboratory',
        paymentStatus: 'paid',
        ...(startDate && endDate ? {
          createdAt: { $gte: startDate, $lte: endDate }
        } : {}),
      };

      const orders = await Order.find(orderFilter).lean();
      
      let gbv = 0;
      let commission = 0;
      let payout = 0;
      let ordersCount = 0;

      for (const order of orders) {
        if (!order.totalAmount) continue;
        const { commission: comm, earning } = calculateProviderEarning(order.totalAmount, 'laboratory');
        gbv += order.totalAmount;
        commission += comm;
        payout += earning;
        ordersCount += 1;
      }

      providerSummaries.push({
        id: lab._id.toString(),
        name: lab.labName,
        email: lab.email,
        gbv,
        commission,
        payout,
        orders: ordersCount,
        transactions: ordersCount,
      });
    }
  } else if (type === 'pharmacy') {
    providers = await Pharmacy.find({ isActive: true })
      .select('pharmacyName email')
      .lean();

    for (const pharmacy of providers) {
      const orderFilter = {
        providerId: pharmacy._id,
        providerType: 'pharmacy',
        paymentStatus: 'paid',
        ...(startDate && endDate ? {
          createdAt: { $gte: startDate, $lte: endDate }
        } : {}),
      };

      const orders = await Order.find(orderFilter).lean();
      
      let gbv = 0;
      let commission = 0;
      let payout = 0;
      let ordersCount = 0;

      for (const order of orders) {
        if (!order.totalAmount) continue;
        const { commission: comm, earning } = calculateProviderEarning(order.totalAmount, 'pharmacy');
        gbv += order.totalAmount;
        commission += comm;
        payout += earning;
        ordersCount += 1;
      }

      providerSummaries.push({
        id: pharmacy._id.toString(),
        name: pharmacy.pharmacyName,
        email: pharmacy.email,
        gbv,
        commission,
        payout,
        orders: ordersCount,
        transactions: ordersCount,
      });
    }
  }

  // Calculate totals
  const totals = providerSummaries.reduce(
    (acc, provider) => ({
      totalGBV: acc.totalGBV + provider.gbv,
      totalCommission: acc.totalCommission + provider.commission,
      totalPayout: acc.totalPayout + provider.payout,
      totalAppointments: acc.totalAppointments + (provider.appointments || 0),
      totalOrders: acc.totalOrders + (provider.orders || 0),
      totalTransactions: acc.totalTransactions + provider.transactions,
    }),
    { totalGBV: 0, totalCommission: 0, totalPayout: 0, totalAppointments: 0, totalOrders: 0, totalTransactions: 0 }
  );

  return res.status(200).json({
    success: true,
    data: {
      type,
      totals,
      providers: providerSummaries,
    },
  });
});
