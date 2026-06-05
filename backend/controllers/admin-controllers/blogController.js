const Blog = require('../../models/Blog');
const asyncHandler = require('../../middleware/asyncHandler');

// @desc    Create a new blog
// @route   POST /api/admin/blogs
// @access  Private (Admin)
exports.createBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.create(req.body);

  res.status(201).json({
    success: true,
    data: blog,
  });
});

// @desc    Get all blogs
// @route   GET /api/admin/blogs
// @access  Private (Admin)
exports.getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.title = { $regex: search, $options: 'i' };
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

// @desc    Get a single blog
// @route   GET /api/admin/blogs/:id
// @access  Private (Admin)
exports.getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    res.status(404);
    throw new Error('Blog not found');
  }

  res.status(200).json({
    success: true,
    data: blog,
  });
});

// @desc    Update a blog
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin)
exports.updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!blog) {
    res.status(404);
    throw new Error('Blog not found');
  }

  res.status(200).json({
    success: true,
    data: blog,
  });
});

// @desc    Delete a blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin)
exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    res.status(404);
    throw new Error('Blog not found');
  }

  await blog.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Blog removed',
  });
});
