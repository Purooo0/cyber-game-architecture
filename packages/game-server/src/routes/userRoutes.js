import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserStats,
  getUserBadges,
  getAvailableMissions,
  getLeaderboard,
  getUserSettings,
  updateUserSettings,
  updateAudioSettings,
  updateGameplaySettings,
  updateSecuritySettings,
} from "../controllers/userController.js";

const router = express.Router();

// User profile endpoints
router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, updateUserProfile);
router.put("/password", authenticate, changePassword);
router.get("/stats", authenticate, getUserStats);
router.get("/badges", authenticate, getUserBadges);
router.get("/missions", authenticate, getAvailableMissions);
router.get("/leaderboard", getLeaderboard);

// Settings endpoints (deprecated - keeping for backward compatibility)
router.get("/settings", authenticate, getUserSettings);
router.put("/settings", authenticate, updateUserSettings);
router.put("/settings/audio", authenticate, updateAudioSettings);
router.put("/settings/gameplay", authenticate, updateGameplaySettings);
router.put("/settings/security", authenticate, updateSecuritySettings);

export default router;
