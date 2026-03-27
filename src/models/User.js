'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [30, 'Name cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return in queries by default
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    relationshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Relationship',
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// userSchema.index({ email: 1 });
userSchema.index({ partnerId: 1 });
userSchema.index({ relationshipId: 1 });

// ── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

// ── Static methods ────────────────────────────────────────────────────────────
userSchema.statics.hashPassword = async function (plaintext) {
  const SALT_ROUNDS = 10;
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

module.exports = mongoose.model('User', userSchema);