const asyncHandler = require('../../middleware/asyncHandler');
const Review = require('../../models/Review');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// POST /api/patients/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { doctorId, appointmentId, rating, comment } = req.body;

  if (!doctorId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Doctor ID and valid rating (1-5) are required',
    });
  }

  // Check if patient has already reviewed this doctor (without appointment)
  if (!appointmentId) {
    const existingReview = await Review.findOne({ 
      patientId: id, 
      doctorId,
      appointmentId: null,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this doctor',
      });
    }
  }

  // Check if appointment exists and belongs to patient
  if (appointmentId) {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: id,
      doctorId,
      status: 'completed',
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not completed',
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this appointment',
      });
    }
  }
  
  

  const review = await Review.create({
    patientId: id,
    doctorId,
    appointmentId: appointmentId || null,
    rating,
    comment: comment || '',
    status: 'pending',
  });

  // Auto-approve reviews (or keep pending for admin approval - change status to 'approved' for immediate display)
  // For now, auto-approve so reviews show immediately
  review.status = 'approved';
  await review.save();
  
  // Update doctor rating (include all approved reviews)
  const approvedReviews = await Review.find({ doctorId, status: 'approved' });
  
  // Calculate average rating from approved reviews
  const averageRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0;

  // Update doctor with new rating and review count
  await Doctor.findByIdAndUpdate(doctorId, {
    rating: Math.round(averageRating * 10) / 10,
    reviewCount: approvedReviews.length,
  });
  
  

  return res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: await Review.findById(review._id)
      .populate('patientId', 'firstName lastName'),
  });
});

// GET /api/patients/reviews
exports.getReviews = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const [reviews, total] = await Promise.all([
    Review.find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .populate('appointmentId', 'appointmentDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ patientId: id }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/reviews/:id
exports.getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reviewId } = req.params;

  const review = await Review.findOne({
    _id: reviewId,
    patientId: id,
  })
    .populate('doctorId', 'firstName lastName specialization profileImage')
    .populate('appointmentId', 'appointmentDate');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: review,
  });
});

