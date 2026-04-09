import { db } from "../config/firebase.js";
import crypto from "crypto";
import { addScoreToUser } from "./scoringService.js";
import { awardBadgeToUser } from "./badgeService.js";

export const startGameSession = async (userId, scenarioId) => {
  const sessionId = crypto.randomUUID();

  const sessionData = {
    id: sessionId,
    userId,
    scenarioId,
    currentScene: "intro",
    status: "ACTIVE",
    score: 0,
    startedAt: Date.now(),
    endedAt: null,
  };

  await db.ref(`gameSessions/${sessionId}`).set(sessionData);

  return sessionData;
};

export const transitionGameScene = async (sessionId, nextScene) => {
  const sessionRef = db.ref(`gameSessions/${sessionId}`);

  await sessionRef.update({
    currentScene: nextScene,
  });
};

// Alias untuk backward compatibility
export const updateGameScene = async (sessionId, nextScene) => {
  return transitionGameScene(sessionId, nextScene);
};

export const addScoreToSession = async (sessionId, scoreDelta) => {
  const sessionRef = db.ref(`gameSessions/${sessionId}`);
  const snapshot = await sessionRef.once("value");
  const session = snapshot.val();

  const newScore = (session.score || 0) + scoreDelta;

  await sessionRef.update({
    score: newScore,
  });

  return newScore;
};

export const endGameSession = async (sessionId) => {
  const sessionRef = db.ref(`gameSessions/${sessionId}`);
  const snapshot = await sessionRef.once("value");
  const session = snapshot.val();

  if (!session || session.status !== "ACTIVE") {
    throw new Error("Invalid or inactive session");
  }

  await sessionRef.update({
    status: "COMPLETED",
    endedAt: Date.now(),
  });

  // Tambahkan score session ke totalScore user
  await addScoreToUser(session.userId, session.score);

  // Add scenario to completed scenarios and award badge
  const userRef = db.ref(`users/${session.userId}`);
  const userSnapshot = await userRef.once("value");
  const user = userSnapshot.val();

  const completedScenarios = user.completedScenarios || [];
  if (!completedScenarios.includes(session.scenarioId)) {
    completedScenarios.push(session.scenarioId);
    await userRef.update({ completedScenarios });

    // Award badge for completing this scenario
    await awardBadgeToUser(session.userId, session.scenarioId);
  }

  return session;
};

// Alias untuk backward compatibility
export const completeGameSession = async (sessionId) => {
  return endGameSession(sessionId);
};

/**
 * Abandon a game session without completing it
 */
export const abandonGameSession = async (sessionId) => {
  const sessionRef = db.ref(`gameSessions/${sessionId}`);
  const snapshot = await sessionRef.once("value");
  const session = snapshot.val();

  if (!session) {
    throw new Error("Session not found");
  }

  await sessionRef.update({
    status: "ABANDONED",
    endedAt: Date.now(),
  });

  return session;
};

/**
 * Get session details
 */
export const getSessionDetails = async (sessionId) => {
  const snapshot = await db.ref(`gameSessions/${sessionId}`).once("value");
  return snapshot.val();
};

/**
 * Submit session to leaderboard
 */
export const submitSessionToLeaderboard = async (sessionId) => {
  const sessionRef = db.ref(`gameSessions/${sessionId}`);
  const snapshot = await sessionRef.once("value");
  const session = snapshot.val();

  if (!session || session.status !== "COMPLETED") {
    return {
      success: false,
      reason: "Session must be completed before submitting to leaderboard",
    };
  }

  // Create leaderboard entry
  const leaderboardEntry = {
    userId: session.userId,
    scenarioId: session.scenarioId,
    score: session.score,
    timestamp: Date.now(),
  };

  // Save to leaderboard
  const leaderboardRef = db.ref(`leaderboard/${session.scenarioId}`).push();
  await leaderboardRef.set(leaderboardEntry);

  return {
    success: true,
    leaderboardEntry,
  };
};

/**
 * Get leaderboard for a specific scenario
 */
export const getScenarioLeaderboard = async (scenarioId, limit = 100) => {
  const snapshot = await db
    .ref(`leaderboard/${scenarioId}`)
    .orderByChild("score")
    .limitToLast(limit)
    .once("value");

  const entries = snapshot.val() || {};
  return Object.values(entries)
    .sort((a, b) => b.score - a.score);
};