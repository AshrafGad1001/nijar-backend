const express = require('express');
const router = express.Router();
const { getFullMenu } = require('../controllers/menuController');

// Public route — no auth required
router.get('/', getFullMenu);

module.exports = router;
