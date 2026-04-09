import { getLeaderboardData } from "../services/leaderboardService.js";

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await getLeaderboardData(10);

    res.status(200).json({
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};