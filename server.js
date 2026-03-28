'use strict';

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const fs = require('fs');
const path = require('path');

const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const createApp = require('./src/app');
const { registerSocketHandlers } = require('./src/socket/socketHandler');

async function bootstrap() {
  // ── Ensure upload directory exists ─────────────────────────────────────
  const uploadDir = path.join(process.cwd(), config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Server] Created upload directory: ${uploadDir}`);
  }

  // ── Connect to MongoDB ──────────────────────────────────────────────────
  await connectDB();

  // ── Create Express app ──────────────────────────────────────────────────
  const app = createApp();

  // ── Create HTTP server ──────────────────────────────────────────────────
  const httpServer = http.createServer(app);

  // ── Attach Socket.io ────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin === '*' ? '*' : config.cors.origin.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  app.set('io', io);
  registerSocketHandlers(io);

  // ── Start listening ─────────────────────────────────────────────────────
  
const PORT = process.env.PORT || 5000;

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const WS_URL = BASE_URL.startsWith('https')
  ? BASE_URL.replace('https', 'wss')
  : BASE_URL.replace('http', 'ws');

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  🌿 VibeSync Backend');
  console.log(`  ─────────────────────────────────`);
  console.log(`  ENV  : ${config.env}`);
  console.log(`  PORT : ${PORT}`);
  console.log(`  API  : ${BASE_URL}/api`);
  console.log(`  WS   : ${WS_URL}`);
  console.log('');
});

  // ── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n[Server] ${signal} received — shutting down gracefully...`);
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
    // Force quit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err.message);
    process.exit(1);
  });
}

bootstrap();