const DoctorCategory = require('../../models/DoctorCategory');
const asyncHandler = require('../../middleware/asyncHandler');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary (safe – uses env vars if present)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const { Readable } = require('stream');

/**
 * Upload buffer to Cloudinary; returns URL string or null on failure.
 * Falls back to base64 data URL if Cloudinary is not configured (dev mode).
 */
const uploadToCloudinary = async (buffer, mimetype) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // No Cloudinary config – return base64 data URL so the API still works locally
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'heallyn/categories', resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('[DEBUG] Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });
    readableStream.pipe(stream);
  });
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
exports.getCategories = asyncHandler(async (req, res) => {
  console.log('[DEBUG] getCategories called');
  try {
    const categories = await DoctorCategory.find().sort({ createdAt: -1 }).lean();
    console.log('[DEBUG] categories found:', categories.length);
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    console.error('[DEBUG] Error in getCategories find():', err);
    throw err;
  }
});

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  console.log('[DEBUG] createCategory called with body:', req.body);
  const { name, isActive } = req.body;
  let image = null;

  if (req.file && req.file.buffer) {
    console.log('[DEBUG] Image file received, uploading to Cloudinary...', req.file.mimetype);
    try {
      image = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      console.log('[DEBUG] Cloudinary upload successful:', image);
    } catch (uploadErr) {
      console.error('[DEBUG] Image upload failed:', uploadErr.message);
      // Don't fail the whole request – just save without image
    }
  }

  const categoryExists = await DoctorCategory.findOne({ name }).lean();
  if (categoryExists) {
    return res.status(400).json({ success: false, message: 'Category with this name already exists' });
  }

  const category = await DoctorCategory.create({
    name,
    image,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body;

  let category = await DoctorCategory.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const updateData = { name, isActive };
  if (req.file && req.file.buffer) {
    try {
      updateData.image = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    } catch (uploadErr) {
      console.error('Image upload failed:', uploadErr.message);
    }
  }

  category = await DoctorCategory.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await DoctorCategory.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Category deleted successfully',
  });
});
