import { validateAction } from "./actionValidationService.js";
import { logAction } from "./actionLogService.js";
import { addScoreToSession } from "./gameSessionService.js";
import { scenario1ScoringRules } from "../scenarios/scenario1Scoring.js";

export const handleGameAction = async ({
  session,
  actionType,
}) => {
  const { id: sessionId, userId, currentScene } = session;

  // 1. VALIDASI ACTION & DAPAT NEXT SCENE
  const nextScene = validateAction(currentScene, actionType);

  // 2. HITUNG SCORE
  const scoreDelta = scenario1ScoringRules[actionType] || 0;

  // 3. UPDATE SCORE SESSION
  await addScoreToSession(sessionId, scoreDelta);

  // 4. LOG ACTION
  await logAction({
    sessionId,
    userId,
    sceneId: currentScene,
    actionType,
    scoreDelta,
  });

  return {
    nextScene,
    scoreDelta,
  };
};