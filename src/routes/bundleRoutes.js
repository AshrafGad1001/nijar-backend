const express = require('express');
const router = express.Router();
const {
  createBundle,
  getAdminBundles,
  getBundle,
  updateBundle,
  deleteBundle
} = require('../controllers/bundleController');
const { protect } = require('../middlewares/auth');

router.use(protect); // All bundle routes (admin) are protected

router
  .route('/')
  .get(getAdminBundles)
  .post(createBundle);

router
  .route('/:id')
  .get(getBundle)
  .put(updateBundle)
  .delete(deleteBundle);

module.exports = router;
