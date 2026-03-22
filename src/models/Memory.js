'use strict';

const mongoose = require('mongoose');

const VALID_TAGS = [
  'College', 'Trip', 'LD', 'Date', 'Milestone',
  'Funny', 'Emotional', 'Special', 'Random',
];

const memorySchema = new mongoose.Schema(
  {
    relationshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Relationship',
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    caption: {
      type: String,
      required: [true, 'Caption is required'],
      trim: true,
      maxlength: [200, 'Caption too long'],
    },
    date: {
      type: String, // YYYY-MM-DD — user-chosen date for the memory
      required: true,
    },
    tags: {
      type: [String],
      validate: {
        validator(arr) {
          return arr.every((t) => VALID_TAGS.includes(t));
        },
        message: 'Invalid tag value',
      },
      default: [],
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
memorySchema.index({ relationshipId: 1, date: -1 });
memorySchema.index({ relationshipId: 1, tags: 1 });
memorySchema.index({ addedBy: 1 });

module.exports = mongoose.model('Memory', memorySchema);