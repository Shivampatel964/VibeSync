'use strict';

const { ZodError } = require('zod');
const { AppError } = require('../utils/response.utils');

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Validation failed', 422, errors));
      }
      next(err);
    }
  };
}

/**
 * Validates req.query against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Invalid query parameters', 400, errors));
      }
      next(err);
    }
  };
}

module.exports = { validate, validateQuery };