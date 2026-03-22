'use strict';

const User = require('../models/User');
const Relationship = require('../models/Relationship');
const { AppError } = require('../utils/response.utils');

class ProfileService {
  /**
   * Get user profile + relationship status.
   * @param {string} userId
   * @returns {User}
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);
    return user;
  }

  /**
   * Update user profile fields.
   * @param {string} userId
   * @param {{ name?, avatarUrl?, fernName? }} data
   */
  async updateProfile(userId, { name, avatarUrl, fernName }) {
    const updateUser = {};
    const updateRel = {};

    if (name) updateUser.name = name;
    if (avatarUrl) updateUser.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      userId,
      updateUser,
      { new: true, runValidators: true }
    );

    if (!user) throw new AppError('User not found.', 404);

    // Update fern name on the relationship
    if (fernName && user.relationshipId) {
      await Relationship.findByIdAndUpdate(user.relationshipId, {
        fernName,
      });
    }

    return user;
  }
}

module.exports = new ProfileService();