'use strict';

const config = require('../config/env');
const { AppError } = require('../utils/response.utils');

/**
 * 404 handler — must be registered AFTER all routes.
 */
function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Global error handler — must be registered LAST with 4 params.
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  let { statusCode = 500, message, errors, isOperational } = err;

  // ── Mongoose CastError (bad ObjectId) ─────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
    isOperational = true;
  }

  // ── Mongoose ValidationError ───────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    isOperational = true;
  }

  // ── Mongoose Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] ?? 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    isOperational = true;
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
    isOperational = true;
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
    isOperational = true;
  }

  // ── Multer errors ─────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large.';
    isOperational = true;
  }

  // ── Non-operational (programming) errors — hide details in prod ───────────
  if (!isOperational && config.isProd()) {
    message = 'Something went wrong. Please try again.';
    errors = null;
  }

  // Dev: log full error
  if (config.isDev()) {
    console.error('[Error]', err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (config.isDev() && !isOperational) body.stack = err.stack;

  return res.status(statusCode).json(body);
}

module.exports = { notFound, globalErrorHandler };