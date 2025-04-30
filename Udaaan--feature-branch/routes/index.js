const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const  updateProfile  = require('./profile.routes');

router.use('/auth', authRoutes);
router.use('/profile', updateProfile);


module.exports = router;