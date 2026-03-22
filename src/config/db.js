'use strict';

const mongoose = require('mongoose');
const config = require('./env');

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 5;

async function connectDB(retries = 0) {
  try {
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('[MongoDB] Connected successfully');
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.warn(`[MongoDB] Connection failed. Retry ${retries + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retries + 1);
    }
    console.error('[MongoDB] Could not connect after max retries:', err.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Error:', err.message);
});

module.exports = connectDB;