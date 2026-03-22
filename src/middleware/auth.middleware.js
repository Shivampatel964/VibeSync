'use strict';

const { verifyAccessToken } = require('../utils/jwt.utils');
const { AppError } = require('../utils/response.utils');
const User = require('../models/User');

/**
 * Protects routes — verifies JWT access token from Authorization header.
 * Attaches req.user (User document) and req.userId (string).
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided.', 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired. Please refresh.', 401);
      }
      throw new AppError('Invalid token.', 401);
    }

    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated.', 401);
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches user if token present but doesn't fail if not.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return protect(req, res, next);
}

module.exports = { protect, optionalAuth };