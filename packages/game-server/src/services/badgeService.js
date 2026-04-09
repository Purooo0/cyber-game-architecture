import { db } from "../config/firebase.js";

// Badge definitions - must match scenario badge definitions
const BADGES_DEFINITIONS = {
  "phishing-detective": {
    id: "phishing-detective",
    name: "Phishing Detective",
    icon: "🛡️",
    description: "Berhasil mendeteksi dan menghindari serangan phishing email",
  },
  "wifi-guardian": {
    id: "wifi-guardian",
    name: "WiFi Guardian",
    icon: "🔐",
    description: "Berhasil mengidentifikasi dan menghindari jaringan WiFi palsu (Evil Twin)",
  },
  "privacy-guardian": {
    id: "privacy-guardian",
    name: "Privacy Guardian",
    icon: "🔒",
    description: "Berhasil melindungi data pribadi dari pengumpulan data di media sosial",
  },
};

/**
 * Get all badge definitions
 */
export const getAllBadgeDefinitions = () => {
  return Object.values(BADGES_DEFINITIONS);
};

/**
 * Get badge by scenario ID
 */
export const getBadgeByScenarioId = (scenarioId) => {
  return BADGES_DEFINITIONS[scenarioId];
};

/**
 * Get user badges
 * Badges are now stored as full objects with earnedAt timestamp
 */
export const getBadgesByUserId = async (userId) => {
  try {
    console.log(`[BadgeService] Fetching badges for user: ${userId}`)
    const snapshot = await db.ref(`users/${userId}/badges`).once("value")
    const badgesData = snapshot.val() || []

    console.log(`[BadgeService] Retrieved badges data:`, badgesData)

    // Return badges as-is (they're already full objects with earnedAt)
    // Sort by earnedAt descending (most recent first)
    const sortedBadges = Array.isArray(badgesData) 
      ? badgesData.sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0))
      : []
    
    console.log(`[BadgeService] Returning ${sortedBadges.length} badges`)
    return sortedBadges
  } catch (error) {
    console.error("[BadgeService] Error getting user badges:", error)
    return []
  }
};

/**
 * Award badge to user
 */
export const awardBadgeToUser = async (userId, scenarioId) => {
  try {
    const badge = BADGES_DEFINITIONS[scenarioId];

    if (!badge) {
      console.warn(`Badge not found for scenario ${scenarioId}`);
      return null;
    }

    // Get current badges
    const snapshot = await db.ref(`users/${userId}/badges`).once("value");
    const badges = snapshot.val() || [];

    // Check if already awarded
    if (badges.includes(scenarioId)) {
      console.log(`User ${userId} already has badge for ${scenarioId}`);
      return badge;
    }

    // Add new badge
    badges.push(scenarioId);
    await db.ref(`users/${userId}/badges`).set(badges);

    console.log(`Badge awarded to user ${userId} for scenario ${scenarioId}`);

    return badge;
  } catch (error) {
    console.error("Error awarding badge:", error);
    throw error;
  }
};

/**
 * Check if user has badge
 */
export const userHasBadge = async (userId, scenarioId) => {
  try {
    const snapshot = await db.ref(`users/${userId}/badges`).once("value");
    const badges = snapshot.val() || [];

    return badges.includes(scenarioId);
  } catch (error) {
    console.error("Error checking badge:", error);
    return false;
  }
};
