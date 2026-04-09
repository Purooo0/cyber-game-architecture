import { db } from "../config/firebase.js";
import { hashPassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";
import { v4 as uuidv4 } from "uuid";

export async function registerUser({ username, email, password }) {
  const userId = uuidv4();

  const userData = {
    id: userId,
    username,
    email,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
    totalScore: 0,
    level: 1,
    currentXP: 0,
    xpToNextLevel: 1000,
    badges: [],
    completedScenarios: [],
    rank: 'Rookie',
    // Settings untuk user preferences
    settings: {
      profile: {
        avatar: 'agent-1',
        bio: ''
      },
      account: {
        email: email,
        password: '••••••••'
      },
      audio: {
        masterVolume: 80,
        musicVolume: 70,
        sfxVolume: 80,
        musicEnabled: true,
        sfxEnabled: true
      },
      gameplay: {
        animationsEnabled: true,
        hintsEnabled: true,
        screenReaderMode: false,
        language: 'en'
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true
      },
      privacy: {
        showOnLeaderboard: true,
        allowFriendRequests: true
      }
    }
  };

  await db.ref(`users/${userId}`).set(userData);

  return {
    id: userId,
    email,
  };
};

export async function loginUser({ email, password }) {
  const snapshot = await db.ref("users").once("value");
  const users = snapshot.val();

  const passwordHash = hashPassword(password);

  const user = Object.values(users || {}).find(
    u => u.email === email && u.passwordHash === passwordHash
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({ userId: user.id });

  return { token, user };
}