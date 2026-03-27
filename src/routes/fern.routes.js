'use strict';

const { Router } = require('express');
const { z } = require('zod');
const fernController = require('../controllers/fern.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(protect);

// ── Schemas ──────────────────────────────────────────────────────────────
const VALID_MOODS = ['happy', 'loved', 'calm', 'sad', 'anxious', 'excited'];

const moodSchema = z.object({
  mood: z.enum(VALID_MOODS, {
    errorMap: () => ({ message: `Mood must be one of: ${VALID_MOODS.join(', ')}` }),
  }),
});

const appreciationSchema = z.object({
  message: z.string().min(1).max(200).trim(),
});

const promptAnswerSchema = z.object({
  answer: z.string().min(1).max(500).trim(),
});

// ── Routes ────────────────────────────────────────────────────────────────
router.get('/status', fernController.getFernStatus);
router.get('/appreciation', fernController.getAppreciations);
router.post('/update-activity', fernController.updateActivity);
router.post('/mood', validate(moodSchema), fernController.submitMood);
router.post('/appreciation', validate(appreciationSchema), fernController.sendAppreciation);
router.get('/daily-prompt', fernController.getDailyPrompt);
router.post('/answer-prompt', validate(promptAnswerSchema), fernController.answerDailyPrompt);

module.exports = router;