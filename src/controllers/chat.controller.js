'use strict';

const chatService = require('../services/chat.service');
const { sendSuccess } = require('../utils/response.utils');

class ChatController {
  /**
   * GET /api/chat/messages
   * Query: { relationshipId, page?, limit? }
   */
  async getMessages(req, res, next) {
    try {
      const { relationshipId } = req.query;
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '30', 10)));

      const result = await chatService.getMessages(
        req.userId,
        relationshipId,
        page,
        limit
      );

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Messages fetched.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChatController();