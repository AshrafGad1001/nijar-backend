const express = require('express');
const { login, logout } = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/logout', logout);

module.exports = router;
