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

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

/**
 * Initialize database dengan scenarios saat start
 * Test users hanya dibuat jika INIT_TEST_USERS=true (development mode)
 */
export const initializeDatabase = async () => {
  try {
    console.log("🔄 Initializing database...\n");
    
    // Initialize scenarios (selalu, karena scenario adalah data game)
    await initializeScenariosInDB();
    console.log();
    
    // Initialize default test users HANYA di development mode
    // User seharusnya dibuat melalui register endpoint di production!
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