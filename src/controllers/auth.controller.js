'use strict';

const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

class AuthController {
  /**
   * POST /api/auth/register
   * Body: { name, email, password }
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Account created successfully.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };
      const result = await authService.login({ email, password }, meta);

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Login successful.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/refresh
   * Body: { refreshToken }
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return sendError(res, { statusCode: 400, message: 'Refresh token is required.' });
      }

      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };
      const result = await authService.refreshTokens(refreshToken, meta);

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Tokens refreshed.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   * Body: { refreshToken }
   * Protected route.
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken, req.userId);

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Logged out successfully.',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Body: { email }
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      return sendSuccess(res, {
        statusCode: 200,
        message: result.message,
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();