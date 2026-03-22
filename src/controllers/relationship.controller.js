'use strict';

const relationshipService = require('../services/relationship.service');
const { sendSuccess } = require('../utils/response.utils');

class RelationshipController {
  /**
   * POST /api/relationship/invite
   * Creates or returns existing invite code.
   */
  async createInvite(req, res, next) {
    try {
      const result = await relationshipService.createInvite(req.userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Invite code generated.',
        data: {
          inviteCode: result.inviteCode,
          expiresAt: result.expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/relationship/join
   * Body: { code }
   */
  async joinInvite(req, res, next) {
    try {
      const { code } = req.body;
      const relationship = await relationshipService.joinInvite(req.userId, code);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Paired successfully! 🌿',
        data: relationship,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/relationship/status
   */
  async getStatus(req, res, next) {
    try {
      const relationship = await relationshipService.getStatus(req.userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Status fetched.',
        data: relationship,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RelationshipController();