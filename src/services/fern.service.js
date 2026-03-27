'use strict';

const Relationship = require('../models/Relationship');
const DailyActivity = require('../models/DailyActivity');
const User = require('../models/User');
const Appreciation = require('../models/Appreciation');
const { AppError } = require('../utils/response.utils');
const { getTodayIST, calculateStreakUpdate } = require('../utils/date.utils');
const {
  calculateHealthScore,
  mapScoreToFernStage,
  computeNewUnlocks,
  getDailyPrompt,
} = require('../utils/fern.utils');

class FernService {
  /**
   * Get the full fern status for a user.
   * @param {string} userId
   * @returns {FernStatusResponse}
   */
  async getFernStatus(userId) {
    const { relationship, userField, partnerField } = await this._getRelationshipForUser(userId);
    const today = getTodayIST();

    const todayActivity = await DailyActivity.findOne({
      relationshipId: relationship._id,
      date: today,
    });

    // Determine partner activity
    const isPartnerActive = todayActivity
      ? todayActivity[partnerField] === true
      : false;

    const dailyPrompt = getDailyPrompt(today);
    const streakMessage = this._buildStreakMessage(relationship.streakCount, isPartnerActive);

    return {
      relationship,
      todayActivity: todayActivity ?? null,
      isPartnerActive,
      dailyPrompt,
      streakMessage,
    };
  }

  /**
   * Mark a user as active today.
   * If both users are now active — mark completed, update streak and health score.
   * @param {string} userId
   * @returns {FernStatusResponse}
   */
  async updateActivity(userId) {
    const { relationship, userField, partnerField } = await this._getRelationshipForUser(userId);
    const today = getTodayIST();

    // Upsert today's activity
    let activity = await DailyActivity.findOneAndUpdate(
      { relationshipId: relationship._id, date: today },
      { $set: { [userField]: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const bothActive = activity.user1Active && activity.user2Active;

    if (bothActive && !activity.completed) {
      activity.completed = true;
      await activity.save();

      // Update streak
      const { newStreak, newLastCompletedDate } = calculateStreakUpdate(
        relationship.lastCompletedDate,
        relationship.streakCount
      );

      if (newLastCompletedDate !== relationship.lastCompletedDate) {
        // Recalculate health + stage
        const healthScore = calculateHealthScore({
          streakCount: newStreak,
          bothActiveToday: true,
          appreciationSent: activity.appreciationCount > 0,
          moodPositiveRatio: activity.moodPositiveRatio ?? 0,
          memoryAdded: activity.memoryAdded,
        });

        const fernStage = mapScoreToFernStage(healthScore);
        const prevUnlocks = relationship.specialUnlocks ?? [];
        const newUnlocks = computeNewUnlocks(newStreak, prevUnlocks);

        await Relationship.findByIdAndUpdate(relationship._id, {
          streakCount: newStreak,
          lastCompletedDate: newLastCompletedDate,
          longestStreak: Math.max(relationship.longestStreak, newStreak),
          healthScore,
          fernStage,
          $push: { specialUnlocks: { $each: newUnlocks } },
        });
      }
    }

    return this.getFernStatus(userId);
  }

  /**
   * Submit mood for today.
   * @param {string} userId
   * @param {string} mood
   */
  async submitMood(userId, mood) {
    const { relationship, userField } = await this._getRelationshipForUser(userId);
    const today = getTodayIST();

    const moodField = userField === 'user1Active' ? 'mood1' : 'mood2';

    await DailyActivity.findOneAndUpdate(
      { relationshipId: relationship._id, date: today },
      { $set: { [moodField]: mood } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await this._recalculateHealth(relationship._id);
    return this.getFernStatus(userId);
  }

  /**
   * Send an appreciation message today.
   * @param {string} userId
   * @param {string} message
   * @param {object} io
   */
  async sendAppreciation(userId, message, io) {
    const { relationship, isUser1 } = await this._getRelationshipForUser(userId);
    const today = getTodayIST();
    
    const receiverId = isUser1 ? relationship.user2 : relationship.user1;

    // Create standalone appreciation
    const appreciation = await Appreciation.create({
      senderId: userId,
      receiverId,
      message,
    });

    await DailyActivity.findOneAndUpdate(
      { relationshipId: relationship._id, date: today },
      {
        $inc: { appreciationCount: 1 },
        $push: {
          appreciations: { senderId: userId, message, sentAt: new Date() },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await this._recalculateHealth(relationship._id);

    if (io) {
      io.to(`relationship:${relationship._id}`).emit('appreciation_received', appreciation);
    }

    return this.getFernStatus(userId);
  }

  /**
   * Fetch active appreciation for user
   */
  async getAppreciations(userId) {
    return Appreciation.findOne({ receiverId: userId }).sort({ createdAt: -1 });
  }

  /**
   * Answer the daily prompt.
   * @param {string} userId
   * @param {string} answer
   */
  async answerDailyPrompt(userId, answer) {
    const { relationship } = await this._getRelationshipForUser(userId);
    const today = getTodayIST();

    const existing = await DailyActivity.findOne({
      relationshipId: relationship._id,
      date: today,
    });

    if (existing?.promptAnswered) {
      throw new AppError('You have already answered today\'s prompt.', 400);
    }

    const today_ = getTodayIST();
    await DailyActivity.findOneAndUpdate(
      { relationshipId: relationship._id, date: today_ },
      { $set: { promptAnswered: true, promptAnswer: answer } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await this._recalculateHealth(relationship._id);
    return this.getFernStatus(userId);
  }

  /**
   * Mark memoryAdded = true for today (called from MemoryService after adding).
   * @param {string} relationshipId
   */
  async markMemoryAdded(relationshipId) {
    const today = getTodayIST();
    await DailyActivity.findOneAndUpdate(
      { relationshipId, date: today },
      { $set: { memoryAdded: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await this._recalculateHealth(relationshipId);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Find the relationship for a user and determine which user slot they occupy.
   */
  async _getRelationshipForUser(userId) {
    const user = await User.findById(userId);
    if (!user.relationshipId) {
      throw new AppError('You are not paired with anyone yet.', 404);
    }

    const relationship = await Relationship.findById(user.relationshipId);
    if (!relationship || !relationship.isActive) {
      throw new AppError('Relationship not found or inactive.', 404);
    }

    const isUser1 = relationship.user1.toString() === userId;
    const userField = isUser1 ? 'user1Active' : 'user2Active';
    const partnerField = isUser1 ? 'user2Active' : 'user1Active';

    return { relationship, userField, partnerField, isUser1 };
  }

  /**
   * Recalculate healthScore and fernStage from today's activity.
   */
  async _recalculateHealth(relationshipId) {
    const today = getTodayIST();
    const relationship = await Relationship.findById(relationshipId);
    if (!relationship) return;

    const activity = await DailyActivity.findOne({ relationshipId, date: today });

    const healthScore = calculateHealthScore({
      streakCount: relationship.streakCount,
      bothActiveToday: activity?.completed ?? false,
      appreciationSent: (activity?.appreciationCount ?? 0) > 0,
      moodPositiveRatio: activity?.moodPositiveRatio ?? 0,
      memoryAdded: activity?.memoryAdded ?? false,
    });

    const fernStage = mapScoreToFernStage(healthScore);

    await Relationship.findByIdAndUpdate(relationshipId, {
      healthScore,
      fernStage,
    });
  }

  _buildStreakMessage(streakCount, isPartnerActive) {
    if (!isPartnerActive) return 'Waiting for your partner…';
    if (streakCount === 0) return 'Start your streak today! 🌱';
    if (streakCount === 7) return '7-day milestone unlocked! 🔥';
    if (streakCount === 30) return '30-day streak! New pot unlocked 🪴';
    if (streakCount === 90) return '90 days! New theme unlocked 🌸';
    return `Both of you showed up today 🌿`;
  }
}

module.exports = new FernService();