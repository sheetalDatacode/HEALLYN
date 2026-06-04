const asyncHandler = require('../../middleware/asyncHandler');
const Test = require('../../models/Test');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  // Increased max limit to 10000 to allow fetching all tests at once
  // Default limit is 20, but if limit is explicitly provided, use it (up to 10000)
  const requestedLimit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const limit = Math.min(Math.max(requestedLimit, 1), 10000);
  const skip = (page - 1) * limit;
  
  
  
  return { page, limit, skip };
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !search.trim() || !fields.length) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// GET /api/laboratory/tests
exports.getTests = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { search, category } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { laboratoryId: id, isActive: true };
  if (category) filter.category = category;

  const searchFilter = buildSearchFilter(search, ['name', 'description']);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  

  const [tests, total] = await Promise.all([
    Test.find(finalFilter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Test.countDocuments(finalFilter),
  ]);

  

  return res.status(200).json({
    success: true,
    data: {
      items: tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/laboratory/tests
exports.addTest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { name, description, price, category, preparationInstructions, reportTime } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Test name and price are required',
    });
  }

  const test = await Test.create({
    laboratoryId: id,
    name,
    description,
    price,
    category,
    preparationInstructions,
    reportTime,
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    message: 'Test added successfully',
    data: test,
  });
});

// PATCH /api/laboratory/tests/:id
exports.updateTest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { testId } = req.params;
  const updateData = req.body;

  const test = await Test.findOne({
    _id: testId,
    laboratoryId: id,
  });

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  Object.assign(test, updateData);
  await test.save();

  return res.status(200).json({
    success: true,
    message: 'Test updated successfully',
    data: test,
  });
});

// DELETE /api/laboratory/tests/:id
exports.deleteTest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { testId } = req.params;

  const test = await Test.findOne({
    _id: testId,
    laboratoryId: id,
  });

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  // Soft delete
  test.isActive = false;
  await test.save();

  return res.status(200).json({
    success: true,
    message: 'Test deleted successfully',
  });
});

