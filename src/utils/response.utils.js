'use strict';

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object} options
 */
function sendSuccess(res, { statusCode = 200, message = 'Success', data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {object} options
 */
function sendError(res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { sendSuccess, sendError, AppError };