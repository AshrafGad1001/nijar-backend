const express = require('express');
const router = express.Router();
const { getFullMenu, getProductBySlug } = require('../controllers/catalogController');

const { getPublicBundles, getBundleBySlug } = require('../controllers/bundleController');

// Public route — no auth required
router.get('/', getFullMenu);
router.get('/products/:slug', getProductBySlug);
router.get('/bundles', getPublicBundles);
router.get('/bundles/:slug', getBundleBySlug);

module.exports = router;
