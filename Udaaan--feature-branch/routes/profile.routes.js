const express = require('express');
const router = express.Router();
const {updateProfile, getProfileByEmail} = require('../controllers/profile.controller');

router.post('/update_profile', updateProfile);
router.get('/get_profile', getProfileByEmail);

module.exports = router;