'use strict';

require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`[Config] Missing required env var: ${key}`);
  return val;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '5000'), 10),

  mongo: {
    uri: required('MONGO_URI'),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  cors: {
    origin: optional('CLIENT_ORIGIN', '*'),
  },

  upload: {
    maxFileSizeMb: parseInt(optional('MAX_FILE_SIZE_MB', '10'), 10),
    dir: optional('UPLOAD_DIR', 'uploads'),
  },

  smtp: {
    host: optional('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'VibeSync <no-reply@vibesync.app>'),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MINUTES', '15'), 10) * 60 * 1000,
    max: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    authMax: parseInt(optional('AUTH_RATE_LIMIT_MAX', '10'), 10),
  },

  isDev() {
    return this.env === 'development';
  },

  isProd() {
    return this.env === 'production';
  },
};

module.exports = config;