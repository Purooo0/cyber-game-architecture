import express from "express";
import gameController from '../controllers/gameController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router();

// ✅ Public endpoint to fetch feedback questions (NO AUTH REQUIRED)
router.get("/questions", gameController.getFeedbackQuestions)

// Game session endpoints
router.post("/start", authenticate, gameController.startGame)
router.post("/action", authenticate, gameController.logGameAction)
router.post("/feedback", authenticate, gameController.logFeedbackAnswer)  // ✅ New endpoint for feedback
router.post("/finish", authenticate, gameController.finishGame)

// Scenario endpoints - GET scenario doesn't require auth
router.get("/:scenarioId", authenticate, gameController.getScenario)

// ✅ Admin endpoints for feedback analysis
router.get("/admin/feedback/all", authenticate, requireAdmin, gameController.getAllFeedbackAnswers)
router.get("/admin/feedback/scenario/:scenarioId", authenticate, requireAdmin, gameController.getFeedbackByScenario)
router.get("/admin/feedback/user/:userId", authenticate, requireAdmin, gameController.getFeedbackByUser)

// ✅ Admin analytics (new)
router.get('/admin/analytics', authenticate, requireAdmin, gameController.getAdminAnalytics)
router.get('/admin/analytics/raw', authenticate, requireAdmin, gameController.getAdminAnalyticsRaw)

// ✅ Ending tracking endpoint - Get user's completed endings per mission
router.get("/user/endings", authenticate, gameController.getUserEndingTracking)

export default router;