const express = require('express');
const router = express.Router();
const { registerUser, loginUser,verifyLoginOTP,verifyOTP,resendOTP} = require('../controllers/auth.controller');

router.post('/signup', registerUser);
router.post('/login', loginUser)
router.post('/verify-otp', verifyOTP);
router.post('/login/verify', verifyLoginOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;