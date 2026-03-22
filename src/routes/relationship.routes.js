'use strict';

const { Router } = require('express');
const { z } = require('zod');
const relationshipController = require('../controllers/relationship.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

// All relationship routes require authentication
router.use(protect);

const joinSchema = z.object({
  code: z.string().min(6).max(6).toUpperCase(),
});

router.post('/invite', relationshipController.createInvite);
router.post('/join', validate(joinSchema), relationshipController.joinInvite);
router.get('/status', relationshipController.getStatus);

module.exports = router;