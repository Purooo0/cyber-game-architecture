/**
 * SCENARIO 3: Challenge Seru di Media Sosial
 * Topic: Social Engineering melalui Oversharing & Data Collection
 * 
 * Scoring Rules untuk setiap action yang dilakukan player
 */

export const scenario3ScoringRules = {
  // Intro action
  OPEN_INSTAGRAM: 0, // Neutral - just opening app

  // Scene 1: Challenge viral decision
  JOIN_CHALLENGE: -10, // Bad - jumping into challenge without thinking
  IGNORE_CHALLENGE: 20, // Good - skeptical of trends

  // Scene 2: Answering challenge
  JAWAB_SEMUA: -30, // Very bad - revealing all personal data
  JAWAB_SEBAGIAN: 10, // Better - but still sharing some info

  // Alternative paths
  ASK_FRIENDS: 15, // Good - verify with trusted people
  CHECK_CHALLENGE_SOURCE: 20, // Excellent - investigate legitimacy
  DELETE_OLD_POSTS: 10, // Good - cleaning up past oversharing

  // Consequences
  ACCOUNT_HACKED: 0, // Neutral outcome state
  IDENTITY_STOLEN: 0, // Neutral outcome state
  DATA_SOLD: 0, // Neutral outcome state

  // Final actions
  RESTART: 0, // Neutral - just restarting
  CHANGE_PASSWORD: 5, // Good preventive measure
  REPORT_ACCOUNT: 5, // Good security measure

  // Default for unknown actions
  UNKNOWN_ACTION: 0,
};

/**
 * Notes:
 * - Max positive score: ~45 points (IGNORE_CHALLENGE + CHECK_CHALLENGE_SOURCE + preventive measures)
 * - Minimum score: -40 points (multiple bad choices like JAWAB_SEMUA + JOIN_CHALLENGE)
 * - Safe threshold for good ending: +15 or more
 * 
 * Key Learning Points:
 * 1. Challenge trends can be social engineering vectors
 * 2. Personal data security (security questions, birthday, school name)
 * 3. Data collection and identity theft risks
 * 4. Over-sharing on social media has real consequences
 */
