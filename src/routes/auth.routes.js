'use strict';

const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const router = Router();

// ── Auth-specific stricter rate limiter ───────────────────────────────────
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Zod schemas ────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2).max(30).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(50),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// ── Routes ─────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', protect, validate(logoutSchema), authController.logout);
router.post('/forgot-password', authLimiter, validate(forgotSchema), authController.forgotPassword);

module.exports = router;