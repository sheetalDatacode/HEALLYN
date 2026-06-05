const Blog = require('../../models/Blog');
const asyncHandler = require('../../middleware/asyncHandler');

// @desc    Get active blogs for patients
// @route   GET /api/patients/blogs
// @access  Public or Private(Patient) depending on implementation
exports.getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;
  const skip = (page - 1) * limit;

  const query = { isActive: true };
  if (category) {
    query.category = category;
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Blog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get a single blog for reading
// @route   GET /api/patients/blogs/:id
// @access  Public or Private(Patient)
exports.getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, isActive: true });

  if (!blog) {
    res.status(404);
    throw new Error('Blog not found or inactive');
  }

  res.status(200).json({
    success: true,
    data: blog,
  });
});
