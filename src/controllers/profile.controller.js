'use strict';

const profileService = require('../services/profile.service');
const { buildFileUrl } = require('../middleware/upload.middleware');
const { sendSuccess } = require('../utils/response.utils');

class ProfileController {
  /**
   * GET /api/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await profileService.getProfile(req.userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Profile fetched.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/profile/update
   * Body: multipart/form-data { name?, fernName?, avatar? }
   */
  async updateProfile(req, res, next) {
    try {
      const { name, fernName, avatarUrl: bodyAvatarUrl } = req.body;
      const avatarUrl = req.file ? buildFileUrl(req.file.filename, req) : (bodyAvatarUrl || undefined);

      const user = await profileService.updateProfile(req.userId, {
        name,
        avatarUrl,
        fernName,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Profile updated.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();