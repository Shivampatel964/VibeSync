'use strict';

const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ── Invite system ─────────────────────────────────────────────────────────
    inviteCode: {
      type: String,
      default: null,
      uppercase: true,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false, // becomes true once user2 joins
    },
    // ── Fern / Growth ─────────────────────────────────────────────────────────
    fernName: {
      type: String,
      default: 'Our Fern',
      trim: true,
      maxlength: 30,
    },
    fernStage: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    environmentStage: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    healthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // ── Streak ────────────────────────────────────────────────────────────────
    streakCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCompletedDate: {
      type: String, // ISO date string YYYY-MM-DD (IST)
      default: null,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    // ── Special unlocks (gamification) ────────────────────────────────────────
    specialUnlocks: {
      type: [String],
      default: [],
    },
    // ── Timestamps ────────────────────────────────────────────────────────────
    pairedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
relationshipSchema.index({ user1: 1, user2: 1 }, { unique: true });
relationshipSchema.index({ inviteCode: 1 });

module.exports = mongoose.model('Relationship', relationshipSchema);