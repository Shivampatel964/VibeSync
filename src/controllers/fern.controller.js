'use strict';

const fernService = require('../services/fern.service');
const { sendSuccess } = require('../utils/response.utils');
const { getTodayIST } = require('../utils/date.utils');
const { getDailyPrompt } = require('../utils/fern.utils');

class FernController {
  /**
   * GET /api/fern/status
   * Returns relationship, today's activity, partner status, daily prompt.
   */
  async getFernStatus(req, res, next) {
    try {
      const status = await fernService.getFernStatus(req.userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Fern status fetched.',
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/fern/update-activity
   * Marks user as active today. Returns updated fern status.
   */
  async updateActivity(req, res, next) {
    try {
      const status = await fernService.updateActivity(req.userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Activity updated.',
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/fern/mood
   * Body: { mood }
   */
  async submitMood(req, res, next) {
    try {
      const { mood } = req.body;
      const status = await fernService.submitMood(req.userId, mood);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Mood submitted.',
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/fern/appreciation
   * Body: { message }
   */
  async sendAppreciation(req, res, next) {
    try {
      const { message } = req.body;
      const status = await fernService.sendAppreciation(req.userId, message);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Appreciation sent.',
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/fern/daily-prompt
   */
  async getDailyPrompt(req, res, next) {
    try {
      const today = getTodayIST();
      const prompt = getDailyPrompt(today);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Daily prompt fetched.',
        data: { prompt },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/fern/answer-prompt
   * Body: { answer }
   */
  async answerDailyPrompt(req, res, next) {
    try {
      const { answer } = req.body;
      const status = await fernService.answerDailyPrompt(req.userId, answer);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Prompt answered.',
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FernController();