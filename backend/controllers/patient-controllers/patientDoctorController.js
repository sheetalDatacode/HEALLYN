const asyncHandler = require('../../middleware/asyncHandler');
const Doctor = require('../../models/Doctor');
const Specialty = require('../../models/Specialty');
const Review = require('../../models/Review');
const Session = require('../../models/Session');
const { APPROVAL_STATUS } = require('../../utils/constants');
const { checkSlotAvailability, getAvailabilityForDate } = require('../../services/sessionService');
const { calculateQueueETAs } = require('../../services/etaService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 10000); // Increased max limit to 10000
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !search.trim() || !fields.length) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// GET /api/patients/doctors
exports.getDoctors = asyncHandler(async (req, res) => {
  const { search, specialty, category, subcategory, city, state, rating } = req.query;
  const { page, limit, skip } = buildPagination(req);

  

  const filter = { status: APPROVAL_STATUS.APPROVED, isActive: true };

  if (specialty && specialty !== 'undefined' && specialty.trim()) {
    filter.specialization = new RegExp(specialty.trim(), 'i');
  }
  
  if (category && category !== 'undefined' && category !== 'all') {
    filter.category = category;
  }
  
  if (subcategory && subcategory !== 'undefined') {
    filter.subcategories = subcategory; // This matches if subcategory ID is in the array
  }
  
  if (city) filter['clinicDetails.address.city'] = new RegExp(city.trim(), 'i');
  if (state) filter['clinicDetails.address.state'] = new RegExp(state.trim(), 'i');
  if (rating) filter.rating = { $gte: parseFloat(rating) };

  // Only build search filter if search is provided and not "undefined"
  const searchFilter = (search && search !== 'undefined' && search.trim()) 
    ? buildSearchFilter(search, [
        'firstName',
        'lastName',
        'specialization',
        'clinicDetails.name',
      ])
    : {};

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  

  const [doctors, total] = await Promise.all([
    Doctor.find(finalFilter)
      .select('firstName lastName specialization category subcategories profileImage consultationFee rating clinicDetails bio experienceYears reviewCount')
      .populate('category', 'name image')
      .populate('subcategories', 'name image')
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(finalFilter),
  ]);
  
  

  const response = {
    success: true,
    data: {
      items: doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  };

  
  
  // Log first doctor details to verify data structure
  if (response.data.items.length > 0) {
    const firstDoctor = response.data.items[0];
    
  }

  // Set cache-control headers to prevent caching issues
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  return res.status(200).json(response);
});

// GET /api/patients/doctors/:id
exports.getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id).select('-password -otp -otpExpires');

  if (!doctor || doctor.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  // Get reviews
  const reviews = await Review.find({ doctorId: id, status: 'approved' })
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate review stats
  const reviewStats = await Review.aggregate([
    { $match: { doctorId: doctor._id, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  // Get today's session for ETA calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todaySession = await Session.findOne({
    doctorId: id,
    date: { $gte: today, $lt: todayEnd },
    status: { $in: ['scheduled', 'live', 'paused'] },
  });

  let currentToken = 0;
  let isServing = false;
  let eta = null;
  let nextToken = null;

  if (todaySession) {
    currentToken = todaySession.currentToken || 0;
    isServing = todaySession.status === 'live' && !todaySession.isPaused;
    
    // Calculate next token number and ETA for next patient (if any)
    if (todaySession.currentToken < todaySession.maxTokens) {
      // CRITICAL: Calculate nextToken the same way as in booking flow
      // Use MAX token number (excluding cancelled) + 1, then skip cancelled tokens
      // This ensures the displayed token matches what patient will actually get
      const Appointment = require('../../models/Appointment');
      
      // Find MAX token from all non-cancelled paid appointments
      const maxTokenResult = await Appointment.aggregate([
        {
          $match: {
            sessionId: todaySession._id,
            paymentStatus: 'paid',
            tokenNumber: { $ne: null },
            status: { $nin: ['cancelled', 'cancelled_by_session'] },
          },
        },
        {
          $group: {
            _id: null,
            maxToken: { $max: '$tokenNumber' },
          },
        },
      ]);
      
      const maxTokenNumber = maxTokenResult.length > 0 && maxTokenResult[0].maxToken ? maxTokenResult[0].maxToken : 0;
      let calculatedNextToken = maxTokenNumber + 1;
      
      // Get all cancelled token numbers to skip them
      const cancelledAppointments = await Appointment.find({
        sessionId: todaySession._id,
        status: { $in: ['cancelled', 'cancelled_by_session'] },
        tokenNumber: { $ne: null },
      }).select('tokenNumber');
      
      const cancelledTokenNumbers = new Set(cancelledAppointments.map(apt => apt.tokenNumber));
      
      // Skip cancelled tokens
      while (cancelledTokenNumbers.has(calculatedNextToken) && calculatedNextToken <= todaySession.maxTokens) {
        calculatedNextToken++;
      }
      
      // Ensure we don't exceed maxTokens
      if (calculatedNextToken <= todaySession.maxTokens) {
        nextToken = calculatedNextToken;
        
        // Calculate actual appointment time for the NEW booking (nextToken)
        // Formula: sessionStartTime + (nextToken - 1) × avgConsultation
        // This shows the time when the patient will be called based on their token number
        const Doctor = require('../../models/Doctor');
        const { timeToMinutes } = require('../../services/etaService');
        const doctor = await Doctor.findById(todaySession.doctorId).select('averageConsultationMinutes');
        const avgConsultation = doctor?.averageConsultationMinutes || 20;
        
        // Calculate time for this token based on session start time
        const sessionStartMinutes = timeToMinutes(todaySession.sessionStartTime);
        const tokenTimeMinutes = sessionStartMinutes + (nextToken - 1) * avgConsultation;
        const tokenHour = Math.floor(tokenTimeMinutes / 60);
        const tokenMin = tokenTimeMinutes % 60;
        
        // Convert to 12-hour format
        let displayHour = tokenHour;
        let period = 'AM';
        if (tokenHour >= 12) {
          period = 'PM';
          if (tokenHour > 12) {
            displayHour = tokenHour - 12;
          }
        } else if (tokenHour === 0) {
          displayHour = 12;
        }
        
        eta = `${displayHour}:${tokenMin.toString().padStart(2, '0')} ${period}`;
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      doctor,
      reviews,
      reviewStats: reviewStats[0] || { averageRating: 0, totalReviews: 0 },
      queueInfo: {
        currentToken,
        nextToken,
        isServing,
        eta,
      },
    },
  });
});

// GET /api/patients/specialties
exports.getSpecialties = asyncHandler(async (req, res) => {
  const specialties = await Specialty.find({ isActive: true })
    .select('name description icon doctorCount')
    .sort({ name: 1 });

  return res.status(200).json({
    success: true,
    data: specialties,
  });
});

// GET /api/patients/specialties/:id/doctors
exports.getSpecialtyDoctors = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, skip } = buildPagination(req);
  const mongoose = require('mongoose');

  let specialty = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    specialty = await Specialty.findById(id);
  } else {
    // Translate slug names to database names if they are shorthand
    let searchName = id;
    if (id === 'cardio') searchName = 'cardiology';
    if (id === 'ortho') searchName = 'orthopedic';
    if (id === 'neuro') searchName = 'neurology';

    specialty = await Specialty.findOne({
      name: new RegExp('^' + searchName + '$', 'i'),
    });

    if (!specialty) {
      specialty = await Specialty.findOne({
        name: new RegExp(searchName, 'i'),
      });
    }
  }

  const queryName = specialty ? specialty.name : id;

  const [doctors, total] = await Promise.all([
    Doctor.find({
      specialization: new RegExp(queryName, 'i'),
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
    })
      .select('firstName lastName specialization profileImage consultationFee rating clinicDetails')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments({
      specialization: new RegExp(queryName, 'i'),
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/locations
exports.getLocations = asyncHandler(async (req, res) => {
  // Get unique cities and states from doctors, pharmacies, and laboratories
  const [doctorLocations, pharmacyLocations, labLocations] = await Promise.all([
    Doctor.distinct('clinicDetails.address.city', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'clinicDetails.address.city': { $exists: true, $ne: '' },
    }),
    require('../../models/Pharmacy').distinct('address.city', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.city': { $exists: true, $ne: '' },
    }),
    require('../../models/Laboratory').distinct('address.city', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.city': { $exists: true, $ne: '' },
    }),
  ]);

  const cities = [...new Set([...doctorLocations, ...pharmacyLocations, ...labLocations])].sort();

  const [doctorStates, pharmacyStates, labStates] = await Promise.all([
    Doctor.distinct('clinicDetails.address.state', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'clinicDetails.address.state': { $exists: true, $ne: '' },
    }),
    require('../../models/Pharmacy').distinct('address.state', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.state': { $exists: true, $ne: '' },
    }),
    require('../../models/Laboratory').distinct('address.state', {
      status: APPROVAL_STATUS.APPROVED,
      isActive: true,
      'address.state': { $exists: true, $ne: '' },
    }),
  ]);

  const states = [...new Set([...doctorStates, ...pharmacyStates, ...labStates])].sort();

  return res.status(200).json({
    success: true,
    data: {
      cities,
      states,
    },
  });
});

// GET /api/patients/doctors/:id/slots - Check slot availability for a date
exports.checkDoctorSlotAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required (format: YYYY-MM-DD)',
    });
  }

  const doctor = await Doctor.findById(id);
  if (!doctor || doctor.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format',
    });
  }

  const slotCheck = await checkSlotAvailability(id, appointmentDate);

  return res.status(200).json({
    success: true,
    data: slotCheck,
  });
});

