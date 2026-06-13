const DoctorSubcategory = require('../../models/DoctorSubcategory');
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

/**
 * Upload buffer to Cloudinary; falls back to base64 data URL in dev mode.
 */
const uploadToCloudinary = async (buffer, mimetype) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'heallyn/subcategories', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// @desc    Get all subcategories
// @route   GET /api/admin/subcategories
// @access  Private/Admin
exports.getSubcategories = asyncHandler(async (req, res) => {
  const subcategories = await DoctorSubcategory.find()
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: subcategories.length,
    data: subcategories,
  });
});

// @desc    Create new subcategory
// @route   POST /api/admin/subcategories
// @access  Private/Admin
exports.createSubcategory = asyncHandler(async (req, res) => {
  const { name, category, isActive, isApproved } = req.body;
  let image = null;

  if (req.file && req.file.buffer) {
    try {
      image = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    } catch (uploadErr) {
      console.error('Image upload failed:', uploadErr.message);
    }
  }

  const subcategoryExists = await DoctorSubcategory.findOne({ name, category }).lean();
  if (subcategoryExists) {
    return res.status(400).json({ success: false, message: 'Subcategory with this name already exists in this category' });
  }

  const subcategory = await DoctorSubcategory.create({
    name,
    category,
    image,
    isActive: isActive !== undefined ? isActive : true,
    isApproved: isApproved !== undefined ? isApproved : true,
  });

  res.status(201).json({
    success: true,
    data: subcategory,
  });
});

// @desc    Update subcategory (Admin can approve and edit name/image here)
// @route   PUT /api/admin/subcategories/:id
// @access  Private/Admin
exports.updateSubcategory = asyncHandler(async (req, res) => {
  const { name, category, isActive, isApproved } = req.body;

  let subcategory = await DoctorSubcategory.findById(req.params.id);
  if (!subcategory) {
    return res.status(404).json({ success: false, message: 'Subcategory not found' });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (category !== undefined) updateData.category = category;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isApproved !== undefined) updateData.isApproved = isApproved;

  if (req.file && req.file.buffer) {
    try {
      updateData.image = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    } catch (uploadErr) {
      console.error('Image upload failed:', uploadErr.message);
    }
  }

  subcategory = await DoctorSubcategory.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).lean();

  res.status(200).json({
    success: true,
    data: subcategory,
  });
});

// @desc    Approve a dynamically added subcategory
// @route   PUT /api/admin/subcategories/:id/approve
// @access  Private/Admin
exports.approveSubcategory = asyncHandler(async (req, res) => {
  let subcategory = await DoctorSubcategory.findById(req.params.id);
  if (!subcategory) {
    return res.status(404).json({ success: false, message: 'Subcategory not found' });
  }

  const { name } = req.body;
  if (name) subcategory.name = name;
  if (req.file && req.file.buffer) {
    try {
      subcategory.image = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    } catch (uploadErr) {
      console.error('Image upload failed:', uploadErr.message);
    }
  }

  subcategory.isApproved = true;
  await subcategory.save();

  res.status(200).json({
    success: true,
    data: subcategory,
    message: 'Subcategory approved successfully',
  });
});

// @desc    Delete subcategory
// @route   DELETE /api/admin/subcategories/:id
// @access  Private/Admin
exports.deleteSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await DoctorSubcategory.findById(req.params.id);
  if (!subcategory) {
    return res.status(404).json({ success: false, message: 'Subcategory not found' });
  }

  await subcategory.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Subcategory deleted successfully',
  });
});
