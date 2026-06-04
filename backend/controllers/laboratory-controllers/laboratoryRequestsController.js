const asyncHandler = require('../../middleware/asyncHandler');
const Request = require('../../models/Request');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/laboratory/requests
exports.getRequests = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Find requests where this laboratory is mentioned
  const filter = {
    type: 'book_test_visit',
    $or: [
      { 'adminResponse.lab.labId': id },
      { 'adminResponse.labs.labId': id },
      { 'adminResponse.tests.labId': id },
    ],
  };

  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('patientId', 'firstName lastName phone')
      .populate('prescriptionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Request.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/laboratory/requests/:id
exports.getRequestById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    type: 'book_test_visit',
    $or: [
      { 'adminResponse.lab.labId': id },
      { 'adminResponse.labs.labId': id },
      { 'adminResponse.tests.labId': id },
    ],
  })
    .populate('patientId')
    .populate('prescriptionId');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
  });
});

