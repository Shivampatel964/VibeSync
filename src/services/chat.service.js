'use strict';

const Message = require('../models/Message');
const User = require('../models/User');
const { AppError } = require('../utils/response.utils');

class ChatService {
  /**
   * Fetch paginated messages for a relationship.
   * @param {string} userId        - Requesting user
   * @param {string} relationshipId
   * @param {number} page
   * @param {number} limit
   * @returns {{ messages: Message[], hasMore: boolean, total: number }}
   */
  async getMessages(userId, relationshipId, page = 1, limit = 30) {
    await this._assertBelongsToRelationship(userId, relationshipId);

    const skip = (page - 1) * limit;
    const total = await Message.countDocuments({
      relationshipId,
      isDeleted: false,
    });

    const messages = await Message.find({
      relationshipId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 }) // newest first for pagination
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      messages: messages.reverse(), // return oldest-first per page
      hasMore: skip + messages.length < total,
      total,
    };
  }

  /**
   * Save a message sent via socket (called from socket handler).
   * @param {string} senderId
   * @param {string} relationshipId
   * @param {string} messageText
   * @returns {Message}
   */
  async saveMessage(senderId, relationshipId, messageText) {
    const message = await Message.create({
      relationshipId,
      senderId,
      message: messageText.trim(),
    });
    return message;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  async _assertBelongsToRelationship(userId, relationshipId) {
    const user = await User.findById(userId);
    if (!user.relationshipId || user.relationshipId.toString() !== relationshipId) {
      throw new AppError('Access denied to this conversation.', 403);
    }
  }
}

module.exports = new ChatService();