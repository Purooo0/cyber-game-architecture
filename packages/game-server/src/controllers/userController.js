import { db } from "../config/firebase.js";
import { getBadgesByUserId } from "../services/badgeService.js";
import { getAvailableScenarios } from "../services/scenarioService.js";
import { hashPassword } from "../utils/hash.js";

/**
 * Get user profile data
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('[getUserProfile] Fetching for user:', userId);

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log('[getUserProfile] User data:', { username: user.username, email: user.email });

    // Filter out mission 3 (social-challenge) from completed scenarios
    const allScenarios = await getAvailableScenarios();
    const availableMissions = allScenarios.filter(s => s.id !== 'social-challenge');
    const completedScenarios = user.completedScenarios || [];
    const completedMissions = completedScenarios.filter(id => 
      availableMissions.some(s => s.id === id)
    );

    const profileResponse = {
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level || 1,
        currentXP: user.currentXP || 0,
        xpToNextLevel: user.xpToNextLevel || 1000,
        totalScore: user.totalScore || 0,
        rank: user.rank || "Rookie",
        badgesEarned: (user.badges || []).length,
        completedMissions: completedMissions.length,
        createdAt: user.createdAt,
        avatar: user.avatar || null
      },
    };

    console.log('[getUserProfile] Returning:', profileResponse.profile);
    res.status(200).json(profileResponse);
  } catch (error) {
    console.error('[getUserProfile] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get user stats
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.userId;  // ✅ Use req.userId from authenticate middleware

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const completedScenarios = user.completedScenarios || [];
    const allScenarios = await getAvailableScenarios();
    
    // ✅ Filter out social-challenge (mission 3) - only count mission 1 & 2
    const availableMissions = allScenarios.filter(s => s.id !== 'social-challenge');
    const completedMissions = completedScenarios.filter(id => availableMissions.some(s => s.id === id));

    const statsToReturn = {
      totalScore: user.totalScore || 0,
      level: user.level || 1,
      currentXP: user.currentXP || 0,
      xpToNextLevel: user.xpToNextLevel || 1000,
      completedMissions: completedMissions.length,
      totalMissions: availableMissions.length,
      badgesEarned: (user.badges || []).length,
    };

    console.log('[getUserStats] Returning stats:', statsToReturn);

    res.status(200).json({
      success: true,
      stats: statsToReturn,
    });
  } catch (error) {
    console.error('[getUserStats] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get user badges
 */
export const getUserBadges = async (req, res) => {
  try {
    const userId = req.userId  // ✅ Fixed: middleware stores userId at req.userId

    console.log(`[UserController] getUserBadges - User ID: ${userId}`)

    const badges = await getBadgesByUserId(userId)

    console.log(`[UserController] getUserBadges - Retrieved ${badges.length} badges:`, badges)

    res.status(200).json({
      success: true,
      badges,
      count: badges.length,
    })
  } catch (error) {
    console.error('[UserController] Error in getUserBadges:', error)
    res.status(500).json({ success: false, error: error.message })
  }
};

/**
 * Get available missions (scenarios)
 * Now protected - auth required to track completion
 */
export const getAvailableMissions = async (req, res) => {
  try {
    // ✅ Use req.userId from authenticate middleware
    const userId = req.userId;

    console.log('[getAvailableMissions] Fetching for user:', userId);

    // Get user completed scenarios
    const userSnapshot = await db.ref(`users/${userId}`).once("value");
    const user = userSnapshot.val();
    const completedScenarios = user?.completedScenarios || [];
    console.log('[getAvailableMissions] Completed scenarios:', completedScenarios);

    // Get all available scenarios
    const scenarios = await getAvailableScenarios();
    console.log('[getAvailableMissions] Available scenarios count:', scenarios.length);
    console.log('[getAvailableMissions] Scenarios:', scenarios.map(s => ({ id: s.id, title: s.title })));

    // Format scenarios as missions
    const missions = scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      description: scenario.description || "",
      difficulty: scenario.level || "Easy",
      locked: false,
      completed: completedScenarios.includes(scenario.id),
      topic: scenario.topic || "",
    }));

    console.log('[getAvailableMissions] Returning', missions.length, 'missions');

    res.status(200).json({
      success: true,
      missions,
      count: missions.length,
      completedCount: completedScenarios.length,
    });
  } catch (error) {
    console.error('[getAvailableMissions] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get global leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val() || {};

    // Sort users by totalScore
    const leaderboard = Object.values(users)
      .map((user) => ({
        rank: 0, // will be assigned
        name: user.username,
        userId: user.id,
        score: user.totalScore || 0,
        level: user.level || 1,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit))
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    res.status(200).json({
      success: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get user settings
 */
export const getUserSettings = async (req, res) => {
  try {
    const userId = req.userId;

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const settings = user.settings || {
      profile: { avatar: 'agent-1', bio: '' },
      account: { email: user.email, password: '••••••••' },
      audio: { masterVolume: 80, musicVolume: 70, sfxVolume: 80, musicEnabled: true, sfxEnabled: true },
      gameplay: { animationsEnabled: true, hintsEnabled: true, screenReaderMode: false, language: 'en' },
      security: { twoFactorEnabled: false, loginNotifications: true },
      privacy: { showOnLeaderboard: true, allowFriendRequests: true }
    };

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ success: false, message: "Settings are required" });
    }

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await db.ref(`users/${userId}/settings`).set(settings);

    res.status(200).json({ success: true, message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update user profile (username and avatar)
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, avatar } = req.body;

    console.log('[updateUserProfile] User:', userId, 'Username:', username, 'Avatar:', avatar ? 'present' : 'none');

    if (!username && !avatar) {
      return res.status(400).json({ success: false, message: "Username or avatar is required" });
    }

    const updates = {};
    if (username) updates.username = username;
    if (avatar) updates.avatar = avatar; // Store base64 avatar

    // Update in Firebase
    await db.ref(`users/${userId}`).update(updates);

    console.log('[updateUserProfile] Successfully updated:', Object.keys(updates));

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      username: username,
      avatar: avatar ? "Avatar updated" : undefined
    });
  } catch (error) {
    console.error('[updateUserProfile] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Hash password before storing
    const passwordHash = hashPassword(newPassword);
    
    console.log('[changePassword] Updating password for user:', userId);
    
    // Update passwordHash in Firebase (not "password" field)
    await db.ref(`users/${userId}`).update({
      passwordHash: passwordHash
    });

    console.log('[changePassword] Password updated successfully');

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error('[changePassword] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update user audio settings
 */
export const updateAudioSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { masterVolume, musicVolume, sfxVolume, musicEnabled, sfxEnabled } = req.body;

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const audioSettings = {};
    if (masterVolume !== undefined) audioSettings['masterVolume'] = masterVolume;
    if (musicVolume !== undefined) audioSettings['musicVolume'] = musicVolume;
    if (sfxVolume !== undefined) audioSettings['sfxVolume'] = sfxVolume;
    if (musicEnabled !== undefined) audioSettings['musicEnabled'] = musicEnabled;
    if (sfxEnabled !== undefined) audioSettings['sfxEnabled'] = sfxEnabled;

    await db.ref(`users/${userId}/settings/audio`).update(audioSettings);

    res.status(200).json({ success: true, message: "Audio settings updated successfully", audio: audioSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update user gameplay settings
 */
export const updateGameplaySettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { animationsEnabled, hintsEnabled, screenReaderMode, language } = req.body;

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const gameplaySettings = {};
    if (animationsEnabled !== undefined) gameplaySettings['animationsEnabled'] = animationsEnabled;
    if (hintsEnabled !== undefined) gameplaySettings['hintsEnabled'] = hintsEnabled;
    if (screenReaderMode !== undefined) gameplaySettings['screenReaderMode'] = screenReaderMode;
    if (language !== undefined) gameplaySettings['language'] = language;

    await db.ref(`users/${userId}/settings/gameplay`).update(gameplaySettings);

    res.status(200).json({ success: true, message: "Gameplay settings updated successfully", gameplay: gameplaySettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update user security settings
 */
export const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { twoFactorEnabled, loginNotifications } = req.body;

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const securitySettings = {};
    if (twoFactorEnabled !== undefined) securitySettings['twoFactorEnabled'] = twoFactorEnabled;
    if (loginNotifications !== undefined) securitySettings['loginNotifications'] = loginNotifications;

    await db.ref(`users/${userId}/settings/security`).update(securitySettings);

    res.status(200).json({ success: true, message: "Security settings updated successfully", security: securitySettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
