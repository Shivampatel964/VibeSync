'use strict';

const { Router } = require('express');
const { z } = require('zod');
const memoryController = require('../controllers/memory.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadSingleImage } = require('../middleware/upload.middleware');

const router = Router();

router.use(protect);

/**
 * POST /api/memory/add
 * multipart/form-data: { caption, date, tags?, image? }
 */
router.post('/add', uploadSingleImage, memoryController.addMemory);

/**
 * GET /api/memory/list
 * Query: { page?, limit? }
 */
router.get('/list', memoryController.listMemories);

/**
 * DELETE /api/memory/:id
 */
router.delete('/:id', memoryController.deleteMemory);

module.exports = router;