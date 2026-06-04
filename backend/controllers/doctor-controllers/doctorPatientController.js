const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');
const { getISTDate, parseDateInIST } = require('../../utils/timezoneUtils');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/doctors/patients (Patient queue)
exports.getPatientQueue = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date } = req.query;

  // Handle date properly - parse in IST timezone to ensure consistent date handling regardless of server timezone
  let sessionDate;
  try {
    if (date) {
      sessionDate = parseDateInIST(date);
    } else {
      sessionDate = getISTDate(); // Use current IST date if no date provided
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Invalid date format: ${date}`,
    });
  }
  
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);
  
  

  const Session = require('../../models/Session');
  const { getOrCreateSession, autoEndExpiredSessions } = require('../../services/sessionService');
  const Doctor = require('../../models/Doctor');

  // Auto-end expired sessions before fetching queue
  await autoEndExpiredSessions();

  // Try to get existing session first (include all statuses except cancelled and completed)
  // Don't filter by status initially - we'll check status later
  let session = await Session.findOne({
    doctorId: id,
    date: { $gte: sessionDate, $lt: sessionEndDate },
    status: { $nin: ['cancelled', 'completed'] }, // Exclude only cancelled and completed
  });
  
  // If session is cancelled or completed, treat as no session
  if (session && (session.status === 'cancelled' || session.status === 'completed')) {
    session = null;
  }

  // If no session exists, return null (do NOT auto-create)
  // Sessions should only be created when appointments are booked or manually by doctor
  if (!session) {
    
    // Check if there are any rescheduled appointments for this date that might need a session
    const rescheduledAppointments = await Appointment.find({
      doctorId: id,
      appointmentDate: { $gte: sessionDate, $lt: sessionEndDate },
      status: { $in: ['scheduled', 'confirmed'] },
      paymentStatus: { $ne: 'pending' },
      rescheduledAt: { $exists: true },
    }).countDocuments();
    
    if (rescheduledAppointments > 0) {
      
    }
    
    return res.status(200).json({
      success: true,
      data: {
        session: null,
        appointments: [],
        currentToken: 0,
        message: 'No session available for this date',
      },
    });
  }

  // Get appointments for this session - include all statuses so doctor can see and perform actions
  // Include: scheduled, confirmed, called, in-consultation, in_progress, waiting, completed
  // Also include cancelled appointments (no-show and cancelled-by-session) so they remain visible
  // This ensures doctor can continue with existing patients even after session end time
  // and can see all appointments including cancelled/completed ones
  const appointments = await Appointment.find({
    sessionId: session._id,
    $or: [
      { status: { $in: ['scheduled', 'confirmed', 'called', 'in-consultation', 'in_progress', 'waiting', 'completed', 'cancelled_by_session'] } },
      { status: 'cancelled', queueStatus: 'no-show' }, // Include no-show appointments
      { status: 'cancelled', queueStatus: 'cancelled' } // Include other cancelled appointments
    ],
    paymentStatus: { $ne: 'pending' },
  })
    .populate('patientId', 'firstName lastName phone profileImage dateOfBirth gender')
    .select('-__v -updatedAt') // Exclude unnecessary fields
    .sort({ tokenNumber: 1 });
  
  // Additional verification: Check if there are any appointments with matching appointmentDate
  // that might not be in the session (shouldn't happen, but good to verify)
  const appointmentsByDate = await Appointment.find({
    doctorId: id,
    appointmentDate: { $gte: sessionDate, $lt: sessionEndDate },
    status: { $in: ['scheduled', 'confirmed'] },
    paymentStatus: { $ne: 'pending' },
    sessionId: { $ne: session._id }, // Different session
  }).countDocuments();
  
  if (appointmentsByDate > 0) {
    console.warn(`⚠️ Found ${appointmentsByDate} appointment(s) with matching date but different sessionId. This might indicate a data inconsistency.`);
  }
  
  
  
  // Calculate age from dateOfBirth for each appointment
  const appointmentsWithAge = appointments.map(appt => {
    const apptObj = appt.toObject(); // Convert to plain object
    if (apptObj.patientId && apptObj.patientId.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(apptObj.patientId.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      // Add calculated age to patient object
      apptObj.patientId.age = age;
    } else if (apptObj.patientId) {
      apptObj.patientId.age = 0; // Default to 0 if no dateOfBirth
    }
    return apptObj;
  });

  // Get doctor for average consultation minutes
  const doctor = await Doctor.findById(id).select('averageConsultationMinutes');

  // Format session date to ISO string for frontend
  const sessionDateISO = session.date instanceof Date 
    ? session.date.toISOString().split('T')[0] 
    : new Date(session.date).toISOString().split('T')[0];

  return res.status(200).json({
    success: true,
    data: {
      session: {
        _id: session._id,
        id: session._id, // Also include id for frontend compatibility
        date: sessionDateISO,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime: session.sessionEndTime,
        currentToken: session.currentToken || 0,
        maxTokens: session.maxTokens || 0,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        averageConsultationMinutes: doctor?.averageConsultationMinutes || 20,
      },
      appointments: appointmentsWithAge || [],
      currentToken: session.currentToken || 0,
    },
  });
});

// GET /api/doctors/patients/:id
exports.getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const patientId = req.params.id; // Fix: route parameter is :id, not :patientId

  // Verify patient has appointments OR consultations with this doctor
  // Use mongoose.Types.ObjectId to ensure proper type conversion
  const patientObjectId = mongoose.Types.ObjectId.isValid(patientId) 
    ? new mongoose.Types.ObjectId(patientId) 
    : patientId;
  const doctorObjectId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;

  const [appointment, consultation] = await Promise.all([
    Appointment.findOne({
      doctorId: doctorObjectId,
      patientId: patientObjectId,
    }),
    Consultation.findOne({
      doctorId: doctorObjectId,
      patientId: patientObjectId,
    }),
  ]);

  if (!appointment && !consultation) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no appointments with this doctor',
    });
  }

  const patient = await Patient.findById(patientId).select('-password');

  return res.status(200).json({
    success: true,
    data: patient,
  });
});

// GET /api/doctors/patients/:id/history
exports.getPatientHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const patientId = req.params.id; // Fix: route parameter is :id, not :patientId

  // Verify patient has appointments OR consultations with this doctor
  // Use mongoose.Types.ObjectId to ensure proper type conversion
  const patientObjectId = mongoose.Types.ObjectId.isValid(patientId) 
    ? new mongoose.Types.ObjectId(patientId) 
    : patientId;
  const doctorObjectId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;

  const [appointment, consultation] = await Promise.all([
    Appointment.findOne({
      doctorId: doctorObjectId,
      patientId: patientObjectId,
    }),
    Consultation.findOne({
      doctorId: doctorObjectId,
      patientId: patientObjectId,
    }),
  ]);

  // Debug logging
  

  if (!appointment && !consultation) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found or no appointments with this doctor',
    });
  }

  const LabReport = require('../../models/LabReport');

  const [appointments, consultations, prescriptions, sharedReports] = await Promise.all([
    Appointment.find({ 
      doctorId: doctorObjectId, 
      patientId: patientObjectId,
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    })
      .sort({ appointmentDate: -1 })
      .limit(10),
    Consultation.find({ doctorId: doctorObjectId, patientId: patientObjectId })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ consultationDate: -1 })
      .limit(10),
    Prescription.find({ doctorId: doctorObjectId, patientId: patientObjectId })
      .sort({ createdAt: -1 })
      .limit(10),
    LabReport.find({
      patientId: patientObjectId,
      'sharedWith.doctorId': doctorObjectId,
    })
      .populate('laboratoryId', 'labName')
      .populate('orderId', 'createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      appointments,
      consultations,
      prescriptions,
      sharedLabReports: sharedReports,
    },
  });
});

// GET /api/doctors/all-patients
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Get distinct patient IDs from appointments
  const patientIds = await Appointment.distinct('patientId', { doctorId: id });

  const filter = { _id: { $in: patientIds } };
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .select('firstName lastName email phone profileImage dateOfBirth gender address')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(filter),
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

