const asyncHandler = require('../../middleware/asyncHandler');
const Nurse = require('../../models/Nurse');
const Review = require('../../models/Review');
const { APPROVAL_STATUS } = require('../../utils/constants');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 10000);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !search.trim() || !fields.length) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// GET /api/patients/nurses
exports.getNurses = asyncHandler(async (req, res) => {
  const { search, specialization, city, state, rating } = req.query;
  const { page, limit, skip } = buildPagination(req);

  

  const filter = { status: APPROVAL_STATUS.APPROVED, isActive: true };

  if (specialization && specialization !== 'undefined' && specialization.trim()) {
    filter.specialization = new RegExp(specialization.trim(), 'i');
  }
  if (city) filter['address.city'] = new RegExp(city.trim(), 'i');
  if (state) filter['address.state'] = new RegExp(state.trim(), 'i');
  if (rating) filter.rating = { $gte: parseFloat(rating) };

  // Only build search filter if search is provided and not "undefined"
  const searchFilter = (search && search !== 'undefined' && search.trim()) 
    ? buildSearchFilter(search, [
        'firstName',
        'lastName',
        'specialization',
        'qualification',
        'address.city',
        'address.state',
      ])
    : {};

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  

  // Get nurses
  const nursesQuery = Nurse.find(finalFilter)
    .select('firstName lastName specialization profileImage fees rating experienceYears qualification availability address bio')
    .sort({ rating: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const [nurses, total] = await Promise.all([
    nursesQuery,
    Nurse.countDocuments(finalFilter),
  ]);

  // Get all nurse IDs
  const nurseIds = nurses.map(n => n._id);

  // Calculate review stats for all nurses in one query
  const reviewStatsMap = {};
  if (nurseIds.length > 0) {
    const reviewStats = await Review.aggregate([
      { 
        $match: { 
          nurseId: { $in: nurseIds },
          status: 'approved' 
        } 
      },
      {
        $group: {
          _id: '$nurseId',
          reviewCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    // Create a map for quick lookup
    reviewStats.forEach(stat => {
      reviewStatsMap[stat._id.toString()] = {
        reviewCount: stat.reviewCount,
        averageRating: Math.round(stat.averageRating * 10) / 10,
      };
    });
  }

  // Combine nurse data with review stats
  const nursesWithReviews = nurses.map(nurse => {
    const stats = reviewStatsMap[nurse._id.toString()] || { reviewCount: 0, averageRating: 0 };
    return {
      ...nurse.toObject(),
      reviewCount: stats.reviewCount,
      rating: stats.averageRating > 0 ? stats.averageRating : (nurse.rating || 0),
    };
  });
  
  

  const response = {
    success: true,
    data: {
      items: nursesWithReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  };

  
  
  // Log first nurse details to verify data structure
  if (response.data.items.length > 0) {
    const firstNurse = response.data.items[0];
    
  }

  // Set cache-control headers to prevent caching issues
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  return res.status(200).json(response);
});

// GET /api/patients/nurses/:id
exports.getNurseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const nurse = await Nurse.findById(id).select('-password -otp -otpExpires');

  if (!nurse || nurse.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(404).json({
      success: false,
      message: 'Nurse not found',
    });
  }

  // Get reviews for this nurse
  const reviews = await Review.find({ nurseId: id, status: 'approved' })
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate review stats
  const reviewStats = await Review.aggregate([
    { $match: { nurseId: nurse._id, status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  const stats = reviewStats[0] || {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
  };

  // Calculate rating distribution
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  stats.ratingDistribution.forEach((rating) => {
    if (ratingDistribution[rating] !== undefined) {
      ratingDistribution[rating]++;
    }
  });

  return res.status(200).json({
    success: true,
    data: {
      nurse: {
        ...nurse.toObject(),
        reviewCount: stats.totalReviews,
        rating: stats.averageRating > 0 ? Math.round(stats.averageRating * 10) / 10 : nurse.rating || 0,
      },
      reviews: reviews,
      reviewStats: {
        totalReviews: stats.totalReviews,
        averageRating: stats.averageRating > 0 ? Math.round(stats.averageRating * 10) / 10 : 0,
        ratingDistribution,
      },
    },
  });
});
