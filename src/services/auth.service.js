'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} = require('../utils/jwt.utils');
const { AppError } = require('../utils/response.utils');

class AuthService {
  /**
   * Register a new user.
   * @param {{ name: string, email: string, password: string }} data
   * @returns {{ user, accessToken, refreshToken }}
   */
  async register({ name, email, password }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

    const { accessToken, refreshToken } = await this._issueTokens(user._id.toString());
    return { user, accessToken, refreshToken };
  }

  /**
   * Login with email + password.
   * @param {{ email: string, password: string }} data
   * @param {{ userAgent?: string, ipAddress?: string }} meta
   */
  async login({ email, password }, meta = {}) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    const { accessToken, refreshToken } = await this._issueTokens(
      user._id.toString(),
      meta
    );

    // Strip passwordHash from returned user
    user.passwordHash = undefined;
    return { user, accessToken, refreshToken };
  }

  /**
   * Rotate refresh token — verify old, issue new pair.
   * @param {string} oldRefreshToken
   * @param {{ userAgent?: string, ipAddress?: string }} meta
   */
  async refreshTokens(oldRefreshToken, meta = {}) {
    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const storedToken = await RefreshToken.findOne({
      token: oldRefreshToken,
      isRevoked: false,
    });

    if (!storedToken) {
      // Potential token reuse — revoke all tokens for user (compromise detection)
      await RefreshToken.updateMany({ userId: payload.sub }, { isRevoked: true });
      throw new AppError('Refresh token reuse detected. Please login again.', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      await storedToken.deleteOne();
      throw new AppError('Refresh token expired. Please login again.', 401);
    }

    // Revoke old token (rotation)
    const { accessToken, refreshToken: newRefreshToken } = await this._issueTokens(
      payload.sub,
      meta
    );

    await RefreshToken.findByIdAndUpdate(storedToken._id, {
      isRevoked: true,
      replacedByToken: newRefreshToken,
    });

    const user = await User.findById(payload.sub);
    if (!user) throw new AppError('User not found.', 401);

    return { user, accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — revoke the provided refresh token.
   * @param {string} refreshToken
   * @param {string} userId
   */
  async logout(refreshToken, userId) {
    if (refreshToken) {
      await RefreshToken.updateMany(
        { token: refreshToken, userId },
        { isRevoked: true }
      );
    }
  }

  /**
   * Initiate password reset — generate token, (send email stub).
   * @param {string} email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, you will receive reset instructions.' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // TODO: Send email via nodemailer
    // await emailService.sendPasswordReset(user.email, resetToken);

    console.log(`[ForgotPassword] Reset token for ${email}: ${resetToken}`);
    return { message: 'If that email exists, you will receive reset instructions.' };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  async _issueTokens(userId, meta = {}) {
    const accessToken = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);

    await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    });

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();