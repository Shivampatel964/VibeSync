'use strict';

const { format, differenceInCalendarDays, parseISO } = require('date-fns');

const IST_OFFSET_MINUTES = 330; // UTC+5:30

/**
 * Get today's date string in YYYY-MM-DD format in IST.
 * @returns {string}
 */
function getTodayIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istDate = new Date(utcMs + IST_OFFSET_MINUTES * 60_000);
  return format(istDate, 'yyyy-MM-dd');
}

/**
 * Get IST Date object for now.
 * @returns {Date}
 */
function getNowIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + IST_OFFSET_MINUTES * 60_000);
}

/**
 * Calculate calendar day difference between two YYYY-MM-DD strings.
 * Positive = dateStr2 is after dateStr1.
 * @param {string} dateStr1
 * @param {string} dateStr2
 * @returns {number}
 */
function daysBetween(dateStr1, dateStr2) {
  return differenceInCalendarDays(parseISO(dateStr2), parseISO(dateStr1));
}

/**
 * Calculate streak update logic (calendar-based IST).
 * @param {string|null} lastCompletedDate  YYYY-MM-DD
 * @param {number} currentStreak
 * @returns {{ newStreak: number, newLastCompletedDate: string }}
 */
function calculateStreakUpdate(lastCompletedDate, currentStreak) {
  const today = getTodayIST();

  if (!lastCompletedDate) {
    return { newStreak: 1, newLastCompletedDate: today };
  }

  const diff = daysBetween(lastCompletedDate, today);

  if (diff === 0) {
    // Already counted today
    return { newStreak: currentStreak, newLastCompletedDate: lastCompletedDate };
  }

  if (diff === 1) {
    // Consecutive day — increment
    return { newStreak: currentStreak + 1, newLastCompletedDate: today };
  }

  // Gap — reset streak
  return { newStreak: 1, newLastCompletedDate: today };
}

/**
 * Format a date string nicely.
 * @param {string} dateStr
 * @returns {string}
 */
function formatMemoryDate(dateStr) {
  return format(parseISO(dateStr), 'dd MMMM yyyy');
}

module.exports = {
  getTodayIST,
  getNowIST,
  daysBetween,
  calculateStreakUpdate,
  formatMemoryDate,
};