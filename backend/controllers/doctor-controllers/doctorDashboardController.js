const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Consultation = require('../../models/Consultation');
const Patient = require('../../models/Patient');
const Session = require('../../models/Session');
const WalletTransaction = require('../../models/WalletTransaction');

// GET /api/doctors/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  
  // Convert id to ObjectId to ensure proper matching
  const mongoose = require('mongoose');
  const doctorObjectId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;
  
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
    totalAppointments,
    todayAppointments,
    totalConsultations,
    totalPatients,
    totalEarnings,
    todayEarnings,
    thisMonthEarnings,
    lastMonthEarnings,
    thisMonthConsultations,
    lastMonthConsultations,
  ] = await Promise.all([
    Appointment.countDocuments({ 
      doctorId: doctorObjectId,
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    }),
    Appointment.countDocuments({
      doctorId: doctorObjectId,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }, // Exclude cancelled appointments
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    }),
    Consultation.countDocuments({ doctorId: doctorObjectId, status: 'completed' }),
    Appointment.distinct('patientId', { doctorId: doctorObjectId }).then(ids => ids.length),
    WalletTransaction.aggregate([
      { $match: { userId: doctorObjectId, userType: 'doctor', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: doctorObjectId,
          userType: 'doctor',
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
          userId: doctorObjectId,
          userType: 'doctor',
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
          userId: doctorObjectId,
          userType: 'doctor',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    // This month consultations
    Consultation.countDocuments({
      doctorId: doctorObjectId,
      status: 'completed',
      createdAt: { $gte: currentMonthStart },
    }),
    // Last month consultations
    Consultation.countDocuments({
      doctorId: doctorObjectId,
      status: 'completed',
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
  ]);
  
  

  return res.status(200).json({
    success: true,
    data: {
      totalAppointments,
      todayAppointments,
      totalConsultations,
      totalPatients,
      totalEarnings,
      todayEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      thisMonthConsultations,
      lastMonthConsultations,
    },
  });
});

// GET /api/doctors/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date, status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { doctorId: id };
  // Include all appointments including pending payment and cancelled so doctor can see all appointments
  // This ensures count matches what's displayed in the list
  // Include cancelled appointments so doctor can see complete history
  // Only filter by status if explicitly requested, otherwise show all
  if (status) {
    filter.status = status;
  }
  // If no status filter, show all appointments (including cancelled, pending payment, etc.)
  if (date) {
    const dateObj = new Date(date);
    filter.appointmentDate = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }

  // Calculate date ranges for statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  currentMonthEnd.setHours(23, 59, 59, 999);
  const currentYearStart = new Date(today.getFullYear(), 0, 1);
  const currentYearEnd = new Date(today.getFullYear(), 11, 31);
  currentYearEnd.setHours(23, 59, 59, 999);

  const [appointments, total, stats] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'firstName lastName phone email profileImage dateOfBirth gender')
      .populate('sessionId', 'date sessionStartTime sessionEndTime')
      .sort({ appointmentDate: 1, time: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
    // Calculate statistics for scheduled and rescheduled appointments
    // Include ALL appointments (scheduled, confirmed, cancelled, pending payment) so count matches total
    // Only exclude completed appointments from active counts
    Promise.all([
      // Today - Scheduled (not rescheduled) - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: false },
      }),
      // Today - Rescheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: true },
      }),
      // This Month - Scheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        appointmentDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: false },
      }),
      // This Month - Rescheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        appointmentDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: true },
      }),
      // This Year - Scheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        appointmentDate: { $gte: currentYearStart, $lte: currentYearEnd },
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: false },
      }),
      // This Year - Rescheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        appointmentDate: { $gte: currentYearStart, $lte: currentYearEnd },
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: true },
      }),
      // Total - Scheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: false },
      }),
      // Total - Rescheduled - include all statuses except completed
      Appointment.countDocuments({
        doctorId: id,
        status: { $in: ['scheduled', 'confirmed', 'cancelled', 'cancelled_by_session'] },
        // Include pending payment appointments in count
        rescheduledAt: { $exists: true },
      }),
    ]).then(([
      todayScheduled,
      todayRescheduled,
      monthlyScheduled,
      monthlyRescheduled,
      yearlyScheduled,
      yearlyRescheduled,
      totalScheduled,
      totalRescheduled,
    ]) => ({
      today: {
        scheduled: todayScheduled,
        rescheduled: todayRescheduled,
        total: todayScheduled + todayRescheduled,
      },
      monthly: {
        scheduled: monthlyScheduled,
        rescheduled: monthlyRescheduled,
        total: monthlyScheduled + monthlyRescheduled,
      },
      yearly: {
        scheduled: yearlyScheduled,
        rescheduled: yearlyRescheduled,
        total: yearlyScheduled + yearlyRescheduled,
      },
      total: {
        scheduled: totalScheduled,
        rescheduled: totalRescheduled,
        total: totalScheduled + totalRescheduled,
      },
    })),
  ]);

  // Fetch patient addresses separately for each appointment
  const Patient = require('../../models/Patient');
  const appointmentsWithAddress = await Promise.all(
    appointments.map(async (appt) => {
      const apptObj = appt.toObject();
      if (apptObj.patientId) {
        const patientId = apptObj.patientId._id || apptObj.patientId.id;
        const fullPatient = await Patient.findById(patientId).select('address');
        if (fullPatient) {
          apptObj.patientId.address = fullPatient.address || {};
        }
      }
      return apptObj;
    })
  );

  return res.status(200).json({
    success: true,
    data: {
      items: appointmentsWithAddress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      statistics: stats,
    },
  });
});

// GET /api/doctors/appointments/today
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.find({
    doctorId: id,
    appointmentDate: { $gte: today, $lt: tomorrow },
    status: { $in: ['scheduled', 'confirmed'] },
    paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
  })
    .populate('patientId', 'firstName lastName phone profileImage')
    .populate('sessionId', 'date sessionStartTime sessionEndTime')
    .sort({ time: 1 });

  return res.status(200).json({
    success: true,
    data: appointments,
  });
});

