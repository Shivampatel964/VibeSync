'use strict';

/**
 * Calculate the health score from activity inputs.
 *
 * Formula (V1):
 *   healthScore =
 *     (0.30 × streakDays_normalized)
 *   + (0.20 × dailyCheckIn)
 *   + (0.20 × appreciationSent)
 *   + (0.20 × moodPositiveRatio)
 *   + (0.10 × memoryAdded)
 *
 * All inputs normalized to 0–1 range.
 * Output: 0–100.
 *
 * @param {object} params
 * @param {number} params.streakCount         - Current consecutive days
 * @param {boolean} params.bothActiveToday    - Both users opened app today
 * @param {boolean} params.appreciationSent   - At least 1 appreciation today
 * @param {number} params.moodPositiveRatio   - 0.0–1.0 (from DailyActivity virtual)
 * @param {boolean} params.memoryAdded        - Memory added today
 * @returns {number} healthScore 0–100
 */
function calculateHealthScore({
  streakCount = 0,
  bothActiveToday = false,
  appreciationSent = false,
  moodPositiveRatio = 0,
  memoryAdded = false,
}) {
  // Streak contribution: normalize against 90-day max
  const MAX_STREAK = 90;
  const streakNorm = Math.min(streakCount / MAX_STREAK, 1);

  const score =
    0.30 * streakNorm +
    0.20 * (bothActiveToday ? 1 : 0) +
    0.20 * (appreciationSent ? 1 : 0) +
    0.20 * moodPositiveRatio +
    0.10 * (memoryAdded ? 1 : 0);

  return Math.round(score * 100 * 10) / 10; // 1 decimal place, max 100
}

/**
 * Map health score to fern stage (1–5).
 *
 * Stage 1 (Wilted):    score < 30
 * Stage 2 (Growing):   30 ≤ score < 50
 * Stage 3 (Healthy):   50 ≤ score < 70
 * Stage 4 (Sparkle):   70 ≤ score < 85
 * Stage 5 (Bloom):     score ≥ 85
 *
 * @param {number} healthScore
 * @returns {number} 1–5
 */
function mapScoreToFernStage(healthScore) {
  if (healthScore >= 85) return 5;
  if (healthScore >= 70) return 4;
  if (healthScore >= 50) return 3;
  if (healthScore >= 30) return 2;
  return 1;
}

/**
 * Map streak count to streak milestone type (for unlock notifications).
 * @param {number} streakCount
 * @returns {'streak_7'|'streak_30'|'streak_90'|null}
 */
function getStreakMilestone(streakCount) {
  if (streakCount === 90) return 'streak_90';
  if (streakCount === 30) return 'streak_30';
  if (streakCount === 7) return 'streak_7';
  return null;
}

/**
 * Determine any unlocks to grant based on streak milestones.
 * @param {number} streakCount
 * @param {string[]} currentUnlocks
 * @returns {string[]} newUnlocks to add
 */
function computeNewUnlocks(streakCount, currentUnlocks = []) {
  const newUnlocks = [];
  const MILESTONES = {
    7: 'new_leaf',
    30: 'new_pot',
    90: 'background_theme',
  };
  for (const [days, unlock] of Object.entries(MILESTONES)) {
    if (streakCount >= Number(days) && !currentUnlocks.includes(unlock)) {
      newUnlocks.push(unlock);
    }
  }
  return newUnlocks;
}

const DAILY_PROMPTS = [
  'Aaj partner ko ek line gratitude bhejo 💌',
  'Kal ke liye 1 small plan banaao 📅',
  'Partner ki ek cheez jo tumhe sabse zyada pasand hai batao 💕',
  'Ek memory share karo jo tumhe muskura deti hai 😊',
  'Partner ke liye ek caring message bhejo 🤗',
  'Batao aaj tumhara best moment kya tha? ✨',
  'Partner ko ek compliment do aaj 🌺',
  'Ek cheez batao jo tum dono ke beech unique hai 🌿',
  'Aaj partner ke liye kya special kar sakte ho? 💫',
  'Partner se poochho — aaj unka favourite moment kya tha? 🌸',
];

/**
 * Get the daily prompt for a given date (deterministic by date).
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string}
 */
function getDailyPrompt(dateStr) {
  // Hash the date string to pick a prompt consistently
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % DAILY_PROMPTS.length;
  }
  return DAILY_PROMPTS[hash];
}

module.exports = {
  calculateHealthScore,
  mapScoreToFernStage,
  getStreakMilestone,
  computeNewUnlocks,
  getDailyPrompt,
};