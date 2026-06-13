const express = require('express');
const router = express.Router();
const {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  approveSubcategory,
  deleteSubcategory,
} = require('../../controllers/admin-controllers/subcategoryController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadImage } = require('../../middleware/uploadMiddleware');

router.use(protect('admin'));
router.use(authorize('admin'));

router
  .route('/')
  .get(getSubcategories)
  .post(uploadImage('image'), createSubcategory);

router
  .route('/:id')
  .put(uploadImage('image'), updateSubcategory)
  .patch(updateSubcategory) // Added patch just in case
  .delete(deleteSubcategory);

router
  .route('/:id/approve')
  .patch(uploadImage('image'), approveSubcategory)
  .put(uploadImage('image'), approveSubcategory);

module.exports = router;
