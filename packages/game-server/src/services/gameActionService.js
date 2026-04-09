import { db } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

export const logGameAction = async (sessionId, actionType, value = null) => {
  const actionId = uuidv4();

  const actionData = {
    actionType,
    value,
    timestamp: Date.now(),
  };

  await db
    .ref(`gameActions/${sessionId}/${actionId}`)
    .set(actionData);

  return actionData;
};

export const getActionsBySession = async (sessionId) => {
  const snapshot = await db.ref(`gameActions/${sessionId}`).once("value");
  const data = snapshot.val();

  if (!data) return [];

  return Object.values(data);
};

export const handleGameAction = async ({ session, actionType, value = null }) => {
  try {
    // Log the action
    const action = await logGameAction(session.id, actionType, value);

    // For now, just return the action logged
    // This can be expanded to handle specific game logic based on actionType
    return {
      success: true,
      action,
      message: `Action '${actionType}' logged successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
