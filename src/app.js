'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/env');
const routes = require('./routes/index');
const { notFound, globalErrorHandler } = require('./middleware/error.middleware');

function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
    })
  );

  // ── CORS ────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.cors.origin === '*' ? '*' : config.cors.origin.split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // ── Compression ─────────────────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ─────────────────────────────────────────────────────
  if (config.isDev()) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ── Body parsers ────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── NoSQL injection sanitization ─────────────────────────────────────────
  app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

  // ── Global rate limiter ──────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: { success: false, message: 'Too many requests. Slow down!' },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // ── Static file serving for uploads ─────────────────────────────────────
  app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));

  // ── API Routes ───────────────────────────────────────────────────────────
  app.use('/api', routes);

  // ── Root ─────────────────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.json({ success: true, message: 'VibeSync API 🌿', version: '1.0.0' });
  });

  // ── Error handling (must be last) ────────────────────────────────────────
  app.use(notFound);
  app.use(globalErrorHandler);

  return app;
}

module.exports = createApp;