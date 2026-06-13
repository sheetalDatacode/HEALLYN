const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../../controllers/admin-controllers/categoryController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadImage } = require('../../middleware/uploadMiddleware');

router.use(protect('admin'));
router.use(authorize('admin'));

router
  .route('/')
  .get(getCategories)
  .post(uploadImage('image'), createCategory);

router
  .route('/:id')
  .put(uploadImage('image'), updateCategory)
  .delete(deleteCategory);

module.exports = router;
