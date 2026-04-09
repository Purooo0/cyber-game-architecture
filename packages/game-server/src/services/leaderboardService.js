import { db } from "../config/firebase.js";

export const getLeaderboardData = async (limit = 10) => {
  const snapshot = await db
    .ref("users")
    .orderByChild("totalScore")
    .limitToLast(limit)
    .once("value");

  const data = snapshot.val();
  if (!data) return [];

  const leaderboard = Object.values(data)
    .map((user) => ({
      username: user.username,
      totalScore: user.totalScore || 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return leaderboard;
};