const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { adminLimiter } = require('../middlewares/rateLimiter');
const { upload, checkMagicBytes } = require('../middlewares/upload');
const {
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');

// Public route to get settings (with fallbacks if empty)
router.route('/').get(getSettings);

// Protected routes
router.use(protect);
router.use(adminLimiter);

router.route('/')
  .put(
    upload.single('adminImage'),
    checkMagicBytes,
    updateSettings
  );

module.exports = router;
