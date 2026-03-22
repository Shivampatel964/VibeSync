'use strict';

const mongoose = require('mongoose');

const dailyActivitySchema = new mongoose.Schema(
  {
    relationshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Relationship',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD IST format
      required: true,
    },
    // ── Per-user activity ──────────────────────────────────────────────────────
    user1Active: {
      type: Boolean,
      default: false,
    },
    user2Active: {
      type: Boolean,
      default: false,
    },
    // ── Moods ─────────────────────────────────────────────────────────────────
    mood1: {
      type: String,
      enum: ['happy', 'loved', 'calm', 'sad', 'anxious', 'excited', null],
      default: null,
    },
    mood2: {
      type: String,
      enum: ['happy', 'loved', 'calm', 'sad', 'anxious', 'excited', null],
      default: null,
    },
    // ── Engagement actions ─────────────────────────────────────────────────────
    appreciationCount: {
      type: Number,
      default: 0,
    },
    appreciations: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, maxlength: 200 },
        sentAt: { type: Date, default: Date.now },
      },
    ],
    promptAnswered: {
      type: Boolean,
      default: false,
    },
    promptAnswer: {
      type: String,
      default: null,
      maxlength: 500,
    },
    memoryAdded: {
      type: Boolean,
      default: false,
    },
    // ── Completion ─────────────────────────────────────────────────────────────
    completed: {
      type: Boolean,
      default: false, // true when both users active
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Compound unique index: one document per relationship per day ───────────
dailyActivitySchema.index(
  { relationshipId: 1, date: 1 },
  { unique: true }
);

// ── Virtual: positive mood ratio ──────────────────────────────────────────
dailyActivitySchema.virtual('moodPositiveRatio').get(function () {
  const POSITIVE = ['happy', 'loved', 'calm', 'excited'];
  const moods = [this.mood1, this.mood2].filter(Boolean);
  if (!moods.length) return 0;
  const positiveCount = moods.filter((m) => POSITIVE.includes(m)).length;
  return positiveCount / moods.length;
});

module.exports = mongoose.model('DailyActivity', dailyActivitySchema);