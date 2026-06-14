import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import { initializeScenariosInDB, initializeDefaultUsers } from "./services/dbInitializer.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Cyber Edu Game Backend is running 🚀");
});

// Health check used by local setup and deployment platforms.
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

/**
 * Seed scenario data at startup.
 *
 * Test users are opt-in via INIT_TEST_USERS=true so production/demo
 * deployments do not create public accounts by accident.
 */
export const initializeDatabase = async () => {
  try {
    console.log("🔄 Initializing database...\n");
    
    // Scenarios are part of the game content and should exist in every environment.
    await initializeScenariosInDB();
    console.log();
    
    // Default test users are useful locally, but real users should register normally.
    const initTestUsers = process.env.INIT_TEST_USERS === "true";
    if (initTestUsers) {
      console.log("📝 TEST MODE: Initializing default test users...\n");
      await initializeDefaultUsers();
    } else {
      console.log("ℹ️  TEST USERS: Disabled (use INIT_TEST_USERS=true to enable)\n");
      console.log("✅ Users must be created through proper registration\n");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};

export default app;
