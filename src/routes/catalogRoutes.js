const express = require('express');
const router = express.Router();
const { getFullMenu } = require('../controllers/catalogController');

// Public route — no auth required
router.get('/', getFullMenu);

module.exports = router;
