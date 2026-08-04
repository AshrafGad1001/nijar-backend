const express = require('express');
const { productValidator } = require('../middlewares/validators');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { adminLimiter } = require('../middlewares/rateLimiter');
const { upload, checkMagicBytes } = require('../middlewares/upload');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  getBestSellers,
  getHeroSlides,
} = require('../controllers/productController');

// All routes are protected & rate-limited
router.use(protect);
router.use(adminLimiter);

router.route('/')
  .get(getProducts)
  .post(
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]),
    checkMagicBytes,
    productValidator,
    createProduct
  );

router.route('/featured-works')
  .get(getBestSellers);

router.route('/hero-slides')
  .get(getHeroSlides);

router.route('/reorder')
  .put(reorderProducts);

router.route('/:id')
  .put(
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]),
    checkMagicBytes,
    productValidator,
    updateProduct
  )
  .delete(deleteProduct);

module.exports = router;
