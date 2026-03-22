'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Sign a short-lived access token.
 * @param {string} userId
 * @returns {string}
 */
function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Sign a long-lived refresh token.
 * @param {string} userId
 * @returns {string}
 */
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {{ sub: string }}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {{ sub: string }}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

/**
 * Parse the refresh token expiry into a JS Date.
 * @returns {Date}
 */
function getRefreshTokenExpiry() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
};