import { db } from "../config/firebase.js";
import { ALL_SCENARIOS, SCENARIOS_MAP } from "../data/scenarios/allScenarios.js";
import { v4 as uuidv4 } from "uuid";

export const createGameSession = async (userId, scenarioId) => {
  const sessionId = uuidv4();

  const sessionData = {
    sessionId,
    userId,
    scenarioId,
    status: "IN_PROGRESS",
    startTime: Date.now(),
    endTime: null,
  };

  await db.ref(`gameSessions/${sessionId}`).set(sessionData);

  return sessionData;
};

export const getScenarioById = (scenarioId) => {
  return SCENARIOS_MAP[scenarioId] || null;
};

/**
 * Get all available scenarios
 */
export const getAvailableScenarios = async () => {
  return ALL_SCENARIOS;
};