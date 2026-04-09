/**
 * Database initializer untuk sync scenarios dari file ke Firebase
 * Berjalan sekali saat server start
 */

import { db } from "../config/firebase.js";
import { ALL_SCENARIOS } from "../data/scenarios/allScenarios.js";
import { hashPassword } from "../utils/hash.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Initialize default test users untuk development
 */
export const initializeDefaultUsers = async () => {
  try {
    const testUsers = [
      {
        email: "test@example.com",
        password: "test123",
        username: "TestPlayer",
      },
      {
        email: "demo@example.com",
        password: "demo123",
        username: "DemoUser",
      },
      {
        email: "student@example.com",
        password: "student123",
        username: "StudentOne",
      },
    ];

    // Check apakah users sudah ada
    const usersSnapshot = await db.ref("users").once("value");
    const existingUsers = usersSnapshot.val() || {};

    let createdCount = 0;
    for (const testUser of testUsers) {
      // Check apakah user dengan email ini sudah ada
      const userExists = Object.values(existingUsers).some(
        (u) => u.email === testUser.email
      );

      if (!userExists) {
        const userId = uuidv4();
        const userData = {
          id: userId,
          username: testUser.username,
          email: testUser.email,
          passwordHash: hashPassword(testUser.password),
          createdAt: Date.now(),
          totalScore: 0,
          level: 1,
          currentXP: 0,
          xpToNextLevel: 1000,
          badges: [],
          completedScenarios: [],
          rank: "Rookie",
          settings: {
            profile: { avatar: "agent-1", bio: "" },
            account: { email: testUser.email, password: "••••••••" },
            audio: {
              masterVolume: 80,
              musicVolume: 70,
              sfxVolume: 80,
              musicEnabled: true,
              sfxEnabled: true,
            },
            gameplay: {
              animationsEnabled: true,
              hintsEnabled: true,
              screenReaderMode: false,
              language: "en",
            },
            security: { twoFactorEnabled: false, loginNotifications: true },
            privacy: { showOnLeaderboard: true, allowFriendRequests: true },
          },
        };

        await db.ref(`users/${userId}`).set(userData);
        console.log(`  ✅ Created test user: ${testUser.email}`);
        createdCount++;
      } else {
        console.log(`  ⏭️  Test user already exists: ${testUser.email}`);
      }
    }

    if (createdCount > 0) {
      console.log(`\n✨ ${createdCount} test user(s) created`);
    } else {
      console.log("\n✅ All test users already exist");
    }

    return { success: true, created: createdCount };
  } catch (error) {
    console.error("❌ Error initializing test users:", error.message);
    throw error;
  }
};

/**
 * Initialize scenarios di Firebase
 * Hanya simpan jika belum ada atau structure berbeda
 */
export const initializeScenariosInDB = async () => {
  try {
    console.log("📋 Initializing scenarios in Firebase...");

    // Check apakah scenarios sudah ada
    const snapshot = await db.ref("scenarios").once("value");
    const existingScenariosInDB = snapshot.val() || {};

    // Untuk setiap scenario di file, ensure tersimpan di database
    let syncedCount = 0;
    for (const scenario of ALL_SCENARIOS) {
      const existingInDB = existingScenariosInDB[scenario.id];

      // Simpan jika belum ada atau berbeda (untuk update scenario)
      if (!existingInDB) {
        await db.ref(`scenarios/${scenario.id}`).set(scenario);
        console.log(`  ✅ Synced: ${scenario.title} (${scenario.id})`);
        syncedCount++;
      } else {
        console.log(`  ⏭️  Already exists: ${scenario.id}`);
      }
    }

    if (syncedCount > 0) {
      console.log(`\n✨ ${syncedCount} new scenario(s) synced to Firebase`);
    } else {
      console.log("\n✅ All scenarios already synced");
    }

    return {
      success: true,
      synced: syncedCount,
      total: ALL_SCENARIOS.length,
    };
  } catch (error) {
    console.error("❌ Error initializing scenarios:", error.message);
    throw error;
  }
};

/**
 * Get all scenarios from memory (faster)
 * Firebase adalah backup/cache
 */
export const getAvailableScenariosFromMemory = () => {
  return ALL_SCENARIOS;
};

/**
 * Get scenario count
 */
export const getTotalScenariosCount = () => {
  return ALL_SCENARIOS.length;
};
