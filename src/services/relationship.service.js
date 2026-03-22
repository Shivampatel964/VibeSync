'use strict';

const { customAlphabet } = require('nanoid');
const Relationship = require('../models/Relationship');
const User = require('../models/User');
const { AppError } = require('../utils/response.utils');

// 6-char uppercase alphanumeric invite codes
const generateInviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const INVITE_EXPIRY_HOURS = 24;

class RelationshipService {
  /**
   * Create a pending relationship and return invite code.
   * Only one invite per user allowed at a time.
   * @param {string} userId
   * @returns {{ inviteCode: string, expiresAt: Date }}
   */
  async createInvite(userId) {
    // User must not already be paired
    const user = await User.findById(userId);
    if (user.relationshipId) {
      throw new AppError('You are already paired with someone.', 400);
    }

    // Expire any old pending invites created by this user
    await Relationship.deleteMany({
      user1: userId,
      isActive: false,
      inviteExpiresAt: { $lt: new Date() },
    });

    // Check for existing active invite
    const existing = await Relationship.findOne({
      user1: userId,
      isActive: false,
      inviteExpiresAt: { $gt: new Date() },
    });

    if (existing) {
      return {
        inviteCode: existing.inviteCode,
        expiresAt: existing.inviteExpiresAt,
      };
    }

    const inviteCode = generateInviteCode();
    const inviteExpiresAt = new Date(
      Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await Relationship.create({
      user1: userId,
      user2: userId, // placeholder — will be replaced on join
      inviteCode,
      inviteExpiresAt,
      isActive: false,
    });

    return { inviteCode, expiresAt: inviteExpiresAt };
  }

  /**
   * Join via invite code — pair the two users.
   * @param {string} userId  - The user joining
   * @param {string} code    - 6-char invite code
   * @returns {Relationship}
   */
  async joinInvite(userId, code) {
    const user = await User.findById(userId);
    if (user.relationshipId) {
      throw new AppError('You are already paired with someone.', 400);
    }

    const relationship = await Relationship.findOne({
      inviteCode: code.toUpperCase(),
      isActive: false,
      inviteExpiresAt: { $gt: new Date() },
    });

    if (!relationship) {
      throw new AppError('Invalid or expired invite code.', 404);
    }

    if (relationship.user1.toString() === userId) {
      throw new AppError('You cannot pair with yourself.', 400);
    }

    const creatorUser = await User.findById(relationship.user1);
    if (creatorUser.relationshipId) {
      throw new AppError('This invite is no longer valid.', 400);
    }

    // Activate relationship
    relationship.user2 = userId;
    relationship.isActive = true;
    relationship.inviteCode = null;
    relationship.inviteExpiresAt = null;
    relationship.pairedAt = new Date();
    await relationship.save();

    // Link both users
    await User.findByIdAndUpdate(relationship.user1, {
      partnerId: userId,
      relationshipId: relationship._id,
    });
    await User.findByIdAndUpdate(userId, {
      partnerId: relationship.user1,
      relationshipId: relationship._id,
    });

    return relationship;
  }

  /**
   * Get the active relationship for a user.
   * @param {string} userId
   * @returns {Relationship|null}
   */
  async getStatus(userId) {
    const user = await User.findById(userId);
    if (!user.relationshipId) return null;

    return Relationship.findById(user.relationshipId);
  }
}

module.exports = new RelationshipService();