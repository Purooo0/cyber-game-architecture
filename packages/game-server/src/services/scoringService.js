import { scenario1ScoringRules } from "../data/scoring/scenario1Scoring.js";
import { getActionsBySession } from "./gameActionService.js";
import { db } from "../config/firebase.js";

export const calculateScore = async (sessionId, scenarioId) => {
  const actions = await getActionsBySession(sessionId);

  let totalScore = 0;
  let penalties = 0;

  for (const action of actions) {
    const score = scenario1ScoringRules[action.actionType] || 0;

    if (score < 0) {
      penalties += score;
    } else {
      totalScore += score;
    }
  }

  return {
    totalScore: totalScore + penalties,
    detail: {
      baseScore: totalScore,
      penalty: penalties,
      actionCount: actions.length,
    },
  };
};

export const addScoreToUser = async (userId, scoreDelta) => {
  const userRef = db.ref(`users/${userId}`);

  const snapshot = await userRef.once("value");
  const user = snapshot.val();

  const newScore = (user.totalScore || 0) + scoreDelta;
  
  // Calculate XP to add: score / 10 (rounded)
  const xpDelta = Math.round(scoreDelta / 10);
  
  // Update XP with level-up handling
  let newCurrentXP = (user.currentXP || 0) + xpDelta;
  let newLevel = user.level || 1;
  let newXpToNextLevel = user.xpToNextLevel || 1000;

  // Handle level up
  while (newCurrentXP >= newXpToNextLevel) {
    newCurrentXP -= newXpToNextLevel;
    newLevel += 1;
    newXpToNextLevel = Math.ceil(1000 * (1.1 ** (newLevel - 1))); // 10% increase per level
  }

  // Handle negative XP (shouldn't happen with our scoring, but safe)
  if (newCurrentXP < 0) {
    newCurrentXP = 0;
  }

  await userRef.update({
    totalScore: newScore,
    currentXP: newCurrentXP,
    level: newLevel,
    xpToNextLevel: newXpToNextLevel,
  });

  return newScore;
};