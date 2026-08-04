const express = require('express');
const { menuItemValidator } = require('../middlewares/validators');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { adminLimiter } = require('../middlewares/rateLimiter');
const { upload, checkMagicBytes } = require('../middlewares/upload');
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  getBestSellers,
  getHeroSlides,
} = require('../controllers/menuItemController');

// All routes are protected & rate-limited
router.use(protect);
router.use(adminLimiter);

router.route('/')
  .get(getMenuItems)
  .post(
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]),
    checkMagicBytes,
    menuItemValidator,
    createMenuItem
  );

router.route('/best-sellers')
  .get(getBestSellers);

router.route('/hero-slides')
  .get(getHeroSlides);

router.route('/reorder')
  .put(reorderMenuItems);

router.route('/:id')
  .put(
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]),
    checkMagicBytes,
    menuItemValidator,
    updateMenuItem
  )
  .delete(deleteMenuItem);

module.exports = router;
