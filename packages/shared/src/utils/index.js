/**
 * Shared utilities
 */

/**
 * Calculate level from XP
 */
export function calculateLevelFromXP(xp) {
  return Math.floor(xp / 1000) + 1
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPForNextLevel(currentXP) {
  const currentLevel = calculateLevelFromXP(currentXP)
  const nextLevelXP = currentLevel * 1000
  return nextLevelXP - currentXP
}

/**
 * Format score with thousand separator
 */
export function formatScore(score) {
  return score.toLocaleString()
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correct, total) {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default {
  calculateLevelFromXP,
  calculateXPForNextLevel,
  formatScore,
  formatTime,
  calculateAccuracy,
  generateId
}
