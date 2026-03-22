'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    relationshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Relationship',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message too long'],
    },
    // Future: disappearing messages
    expiresAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
messageSchema.index({ relationshipId: 1, createdAt: -1 }); // Latest messages first
messageSchema.index({ senderId: 1 });

// Future TTL index for disappearing messages
// messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('Message', messageSchema);