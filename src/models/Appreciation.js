'use strict';

const mongoose = require('mongoose');

const appreciationSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      default: 'appreciation',
    },
    expiresAt: {
      type: Date,
      required: true,
      // 24 hours from creation
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

// Add TTL index on expiresAt field so MongoDB automatically deletes the document
appreciationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Appreciation', appreciationSchema);
