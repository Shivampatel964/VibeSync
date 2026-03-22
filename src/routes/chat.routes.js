'use strict';

const { Router } = require('express');
const { z } = require('zod');
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateQuery } = require('../middleware/validate.middleware');

const router = Router();

router.use(protect);

const messagesQuerySchema = z.object({
  relationshipId: z.string().min(1, 'relationshipId is required'),
  page: z.string().optional().transform(Number).pipe(z.number().min(1).optional()),
  limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(50).optional()),
});

router.get('/messages', validateQuery(messagesQuerySchema), chatController.getMessages);

module.exports = router;