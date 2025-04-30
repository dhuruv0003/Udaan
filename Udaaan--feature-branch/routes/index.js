const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const  updateProfile  = require('./profile.routes');
const { verifyOTP } = require('../controllers/auth.controller');

router.use('/auth', authRoutes);
router.use('/profile', updateProfile);
router.post('/verify-otp', verifyOTP);

module.exports = router;