/**
 * SCENARIO 2: Wi-Fi Gratis di Kafe Dekat Sekolah
 * Topic: Evil Twin Wi-Fi & Man-in-the-Middle Attack
 * 
 * Scoring Rules untuk setiap action yang dilakukan player
 */

export const scenario2ScoringRules = {
  // Intro action
  OPEN_WIFI: 0, // Neutral - just opening settings

  // Scene 1: Wi-Fi List - choosing which network to connect to
  CONNECT_LEGIT: 15, // Good! Connect to legitimate Wi-Fi
  CONNECT_EVIL: -20, // Bad! Connect to evil twin
  CHECK_OWNER: 20, // Excellent! Ask owner first

  // Scene 2A: Connected to legit Wi-Fi
  OPEN_GMAIL: 5, // Using email on safe network
  OPEN_BANK: 10, // Extra caution on banking site
  CLOSE_BROWSER: 5, // Prudent behavior

  // Scene 2B: Evil twin WiFi consequences
  DISCONNECT: 10, // Good - disconnect quickly
  
  // Scene 2C: Ask owner
  TAKE_SELFIE: -15, // Bad - posting location info publicly

  // Final actions
  RESTART: 0, // Neutral - just restarting

  // Score penalties and bonuses for critical decisions
  penalty: -25, // Fatal error penalty (e.g., choosing evil twin WiFi)
  bonus: 25, // Bonus for correct WiFi choice with good ending

  // Default for unknown actions
  UNKNOWN_ACTION: 0,
};

/**
 * Notes:
 * - Max positive score: ~60 points (CHECK_OWNER + OPEN_BANK + good decisions)
 * - Minimum score: ~-35 points (multiple bad choices)
 * - Safe threshold for good ending: +20 or more
 * - Fatal penalty: -25 points (evil twin connection mistake)
 */
