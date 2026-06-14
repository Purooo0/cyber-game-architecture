import dotenv from "dotenv";
import app, { initializeDatabase } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Keep startup in one place so Vercel/serverless imports can reuse `app` safely.
const startServer = async () => {
  try {
    // Make sure required game content exists before accepting player sessions.
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}/api`);
      console.log(`🎮 Ready for game sessions!\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
