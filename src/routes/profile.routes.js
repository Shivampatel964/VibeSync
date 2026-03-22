'use strict';

const { Router } = require('express');
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

const router = Router();

router.use(protect);

router.get('/', profileController.getProfile);
router.put('/update', uploadAvatar, profileController.updateProfile);

module.exports = router;