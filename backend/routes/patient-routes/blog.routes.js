const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogById,
} = require('../../controllers/patient-controllers/blogController');

// Using them as public routes so patients can read them even before logging in, 
// or you can protect them if you prefer. For now, public/patient accessible.
router.route('/')
  .get(getBlogs);

router.route('/:id')
  .get(getBlogById);

module.exports = router;
