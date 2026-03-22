'use strict';

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const relationshipRoutes = require('./relationship.routes');
const fernRoutes = require('./fern.routes');
const chatRoutes = require('./chat.routes');
const memoryRoutes = require('./memory.routes');
const profileRoutes = require('./profile.routes');

const router = Router();

// ── Health check ─────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VibeSync API is alive 🌿',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// ── Feature routes ────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/relationship', relationshipRoutes);
router.use('/fern', fernRoutes);
router.use('/chat', chatRoutes);
router.use('/memory', memoryRoutes);
router.use('/profile', profileRoutes);

module.exports = router;