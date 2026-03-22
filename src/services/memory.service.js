'use strict';

const Memory = require('../models/Memory');
const User = require('../models/User');
const fernService = require('./fern.service');
const { AppError } = require('../utils/response.utils');

class MemoryService {
  /**
   * Add a new memory.
   * @param {string} userId
   * @param {{ caption, date, tags?, imageUrl? }} data
   * @returns {Memory}
   */
  async addMemory(userId, { caption, date, tags = [], imageUrl = null }) {
    const user = await User.findById(userId);
    if (!user.relationshipId) {
      throw new AppError('You must be paired to add memories.', 400);
    }

    const memory = await Memory.create({
      relationshipId: user.relationshipId,
      addedBy: userId,
      caption,
      date,
      tags,
      imageUrl,
    });

    // Mark memory added in daily activity → triggers health score recalculate
    try {
      await fernService.markMemoryAdded(user.relationshipId.toString());
    } catch {
      // Non-critical — don't fail memory creation
    }

    return memory;
  }

  /**
   * Get paginated memories for a relationship.
   * @param {string} userId
   * @param {number} page
   * @param {number} limit
   * @returns {{ memories, hasMore, total }}
   */
  async getMemories(userId, page = 1, limit = 20) {
    const user = await User.findById(userId);
    if (!user.relationshipId) {
      return { memories: [], hasMore: false, total: 0 };
    }

    const skip = (page - 1) * limit;
    const total = await Memory.countDocuments({
      relationshipId: user.relationshipId,
      isDeleted: false,
    });

    const memories = await Memory.find({
      relationshipId: user.relationshipId,
      isDeleted: false,
    })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      memories,
      hasMore: skip + memories.length < total,
      total,
    };
  }

  /**
   * Soft-delete a memory. Only the creator or their partner can delete.
   * @param {string} userId
   * @param {string} memoryId
   */
  async deleteMemory(userId, memoryId) {
    const user = await User.findById(userId);

    const memory = await Memory.findById(memoryId);
    if (!memory || memory.isDeleted) {
      throw new AppError('Memory not found.', 404);
    }

    if (
      memory.relationshipId.toString() !== user.relationshipId?.toString()
    ) {
      throw new AppError('You do not have access to this memory.', 403);
    }

    memory.isDeleted = true;
    await memory.save();
  }
}

module.exports = new MemoryService();