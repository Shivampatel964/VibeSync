'use strict';

const memoryService = require('../services/memory.service');
const { buildFileUrl } = require('../middleware/upload.middleware');
const { sendSuccess } = require('../utils/response.utils');

class MemoryController {
  /**
   * POST /api/memory/add
   * Body: multipart/form-data { caption, date, tags?, image? }
   */
  async addMemory(req, res, next) {
    try {
      const { caption, date } = req.body;
      let tags = [];

      // Parse tags from JSON string or array
      if (req.body.tags) {
        try {
          tags = typeof req.body.tags === 'string'
            ? JSON.parse(req.body.tags)
            : req.body.tags;
          if (!Array.isArray(tags)) tags = [];
        } catch {
          tags = [];
        }
      }

      const imageUrl = req.file
        ? buildFileUrl(req.file.filename, req)
        : null;

      const memory = await memoryService.addMemory(req.userId, {
        caption,
        date,
        tags,
        imageUrl,
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Memory saved.',
        data: memory,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/memory/list
   * Query: { page?, limit? }
   */
  async listMemories(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '20', 10)));

      const result = await memoryService.getMemories(req.userId, page, limit);

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Memories fetched.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/memory/:id
   */
  async deleteMemory(req, res, next) {
    try {
      await memoryService.deleteMemory(req.userId, req.params.id);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Memory deleted.',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MemoryController();