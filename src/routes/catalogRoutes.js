const express = require('express');
const router = express.Router();
const { getFullMenu, getProductBySlug } = require('../controllers/catalogController');

// Public route — no auth required
router.get('/', getFullMenu);
router.get('/products/:slug', getProductBySlug);

module.exports = router;
