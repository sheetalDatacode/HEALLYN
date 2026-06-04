const asyncHandler = require('../../middleware/asyncHandler');
const Review = require('../../models/Review');

// Helper function for pagination
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/doctors/reviews - Get doctor reviews
exports.getDoctorReviews = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const [reviews, total] = await Promise.all([
    Review.find({ doctorId: id, status: 'approved' })
      .populate('patientId', 'firstName lastName profileImage')
      .populate('appointmentId', 'appointmentDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ doctorId: id, status: 'approved' }),
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

// GET /api/doctors/reviews/stats - Get review statistics
exports.getReviewStats = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const reviews = await Review.find({ doctorId: id, status: 'approved' });

  const stats = {
    totalReviews: reviews.length,
    averageRating: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  };

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => {
      stats.ratingDistribution[review.rating]++;
      return sum + review.rating;
    }, 0);
    stats.averageRating = (totalRating / reviews.length).toFixed(1);
  }

  return res.status(200).json({
    success: true,
    data: stats,
  });
});

