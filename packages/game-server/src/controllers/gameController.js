import { GameSession } from '../models/GameSession.js'
import { User } from '../models/User.js'
import { ACTION_SCORES } from '../config/actionScoring.js'
import { db } from '../config/firebase.js'
import { getQuestionById, getAllQuestions, getQuestionsByScenario } from '../config/feedbackQuestions.js'
import { getScenarioById } from '../services/scenarioService.js'

/**
 * Start a new game session
 */
export const startGame = async (req, res) => {
  try {
    const { scenarioId } = req.body
    const userId = req.userId
    
    if (!scenarioId) {
      return res.status(400).json({ error: 'Missing scenarioId' })
    }

    const session = new GameSession({
      userId,
      scenarioId,
      score: 0,
      actions: [],
      startedAt: new Date(),
      completedAt: null
    })

    await session.save()

    console.log(`[GameServer] Game session started:`, session._id)

    res.json({
      success: true,
      session: {
        id: session._id,
        userId,
        scenarioId,
        score: 0
      }
    })
  } catch (error) {
    console.error('[GameServer] Error starting game:', error)
    res.status(500).json({ error: 'Failed to start game' })
  }
}

/**
 * Log game action and calculate score
 */
export const logGameAction = async (req, res) => {
  try {
    const { sessionId, actionType, value } = req.body
    
    if (!sessionId || !actionType) {
      return res.status(400).json({ error: 'Missing sessionId or actionType' })
    }

    const session = await GameSession.findById(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const actionScore = ACTION_SCORES[actionType] || 0
    
    session.actions.push({
      type: actionType,
      score: actionScore,
      timestamp: new Date(),
      value: value
    })

    session.score = (session.score || 0) + actionScore
    console.log(`[GameServer] DEBUG logGameAction - Before save: sessionId=${sessionId}, score=${session.score}, actions.length=${session.actions.length}`)
    
    await session.save()

    console.log(`[GameServer] DEBUG logGameAction - After save: sessionId=${sessionId}, score=${session.score}`)
    console.log(`[GameServer] Action logged: ${actionType} (+${actionScore} points, session total: ${session.score})`)

    res.json({
      success: true,
      actionType,
      scoreEarned: actionScore,
      sessionScore: session.score,  // ✅ Return session score correctly
      message: `${actionType} logged successfully`
    })
  } catch (error) {
    console.error('[GameServer] Error logging action:', error)
    res.status(500).json({ error: 'Failed to log action' })
  }
}

/**
 * Finish game session
 */
export const finishGame = async (req, res) => {
  try {
    const { sessionId, sceneId } = req.body
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' })
    }

    const session = await GameSession.findById(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    console.log(`[GameServer] DEBUG finishGame - Retrieved session: sessionId=${sessionId}, scenarioId=${session.scenarioId}, sceneId=${sceneId}, score=${session.score}`)

    session.completedAt = new Date()
    
    // ✅ NEW: Track sceneId in session if provided
    if (sceneId) {
      session.sceneId = sceneId
      console.log(`[GameServer] Scene tracking: sceneId=${sceneId}`)
    }

    await session.save()

    // ✅ FIX: Use session.score that was accumulated from logGameAction
    let sessionScore = session.score || 0
    console.log(`[GameServer] Game finishing - Session: ${sessionId}, Raw Score: ${sessionScore}, SceneId: ${sceneId}`)

    // 🔐 NEW: Check if SCENE already completed to limit scoring
    // Player can play multiple times but only gets score on FIRST scene completion
    // EXP is awarded every time
    const userId = session.userId
    let isFirstSceneCompletion = false
    let scoreToAward = 0
    let xpToAward = 0

    try {
      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once("value")
      const user = snapshot.val()

      if (user) {
        // ✅ NEW: Check scene completion tracking per scenario
        const userCompletedScenes = user.completedScenes || {}
        const scenarioCompletedScenes = userCompletedScenes[session.scenarioId] || []
        
        // Check if this scene was already completed
        isFirstSceneCompletion = sceneId ? !scenarioCompletedScenes.includes(sceneId) : true
        
        // Only award SCORE on first scene completion
        // Award EXP every time (repeat plays give exp)
        scoreToAward = isFirstSceneCompletion ? sessionScore : 0
        xpToAward = Math.round(sessionScore / 10)  // EXP awarded regardless (based on session score)
        
        console.log(`[GameServer] 📊 Scene-Level Scoring Check:`)
        console.log(`   Scenario: ${session.scenarioId}`)
        console.log(`   Scene: ${sceneId || 'unknown'}`)
        console.log(`   Completed Scenes in this scenario: ${scenarioCompletedScenes.join(', ') || 'none'}`)
        console.log(`   First Scene Completion: ${isFirstSceneCompletion}`)
        console.log(`   Score To Award: ${scoreToAward} (${isFirstSceneCompletion ? 'NEW scene' : 'REPEAT scene'})`)
        console.log(`   XP To Award: ${xpToAward} (ALWAYS awarded)`)
      }
    } catch (fbError) {
      console.error('[GameServer] Firebase check error:', fbError)
      // On error, assume first completion to be safe
      scoreToAward = sessionScore
      xpToAward = Math.round(sessionScore / 10)
      isFirstSceneCompletion = true
    }

    // Update user score using Firebase
    let updatedUserStats = null
    let awardedBadge = null

    try {
      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once("value")
      const user = snapshot.val()

      if (user) {
        // ✅ Use scoreToAward (which may be 0 if not first scene completion)
        // ✅ NEW: Always award xpToAward (even on repeat scenes)
        const newTotalScore = (user.totalScore || 0) + scoreToAward
        let newCurrentXP = (user.currentXP || 0) + xpToAward
        let newLevel = user.level || 1
        let newXpToNextLevel = user.xpToNextLevel || 1000

        // Handle level up
        while (newCurrentXP >= newXpToNextLevel) {
          newCurrentXP -= newXpToNextLevel
          newLevel += 1
          newXpToNextLevel = Math.ceil(1000 * (1.1 ** (newLevel - 1)))
        }

        if (newCurrentXP < 0) {
          newCurrentXP = 0
        }

        await userRef.update({
          totalScore: newTotalScore,
          currentXP: newCurrentXP,
          level: newLevel,
          xpToNextLevel: newXpToNextLevel,
        })

        updatedUserStats = {
          totalScore: newTotalScore,
          currentXP: newCurrentXP,
          level: newLevel,
          xpToNextLevel: newXpToNextLevel,
        }

        console.log(`[GameServer] ✓ User score updated:`, updatedUserStats)
      }
    } catch (fbError) {
      console.error('[GameServer] Firebase update error:', fbError)
    }

    // ✅ NEW: Mark scene as completed ONLY on first scene completion with score
    try {
      if (isFirstSceneCompletion && scoreToAward > 0 && sceneId) {
        const userRef = db.ref(`users/${session.userId}`)
        const snapshot = await userRef.once("value")
        const user = snapshot.val()

        if (user) {
          const userCompletedScenes = user.completedScenes || {}
          const scenarioCompletedScenes = userCompletedScenes[session.scenarioId] || []
          
          // Check if scene not already in list
          if (!scenarioCompletedScenes.includes(sceneId)) {
            scenarioCompletedScenes.push(sceneId)
            userCompletedScenes[session.scenarioId] = scenarioCompletedScenes
            
            await userRef.update({
              completedScenes: userCompletedScenes
            })
            
            console.log(`[GameServer] ✓ Scene marked as completed: Scenario=${session.scenarioId}, Scene=${sceneId}`)
            console.log(`[GameServer]   Total completed scenes in scenario: ${scenarioCompletedScenes.length}`)
          }
        }
      } else if (!isFirstSceneCompletion && sceneId) {
        console.log(`[GameServer] ⏭️ Repeat scene - Already completed: Scenario=${session.scenarioId}, Scene=${sceneId}, no score awarded (EXP only)`)
      } else if (!sceneId) {
        console.log(`[GameServer] ⚠️ Warning: sceneId not provided, cannot track scene completion`)
      }
    } catch (sceneError) {
      console.error('[GameServer] Error marking scene as completed:', sceneError)
    }

    // ✅ NEW: Award badge ONLY on first scene completion with score
    try {
      const scenario = getScenarioById(session.scenarioId)
      console.log(`[GameServer] Badge check - Scenario ID: ${session.scenarioId}, First Scene Completion: ${isFirstSceneCompletion}, Has badge definition: ${!!scenario?.badge}`)
      
      if (scenario && scenario.badge && isFirstSceneCompletion && scoreToAward > 0) {
        console.log(`[GameServer] ✓ Awarding badge: ${scenario.badge.name} (ID: ${scenario.badge.id})`)
        
        // Add badge to user's badges array in Firebase
        const userRef = db.ref(`users/${session.userId}`)
        const snapshot = await userRef.once("value")
        const user = snapshot.val()
        
        console.log(`[GameServer] User data fetched for badge save:`, { userId: session.userId, hasUser: !!user })
        
        if (user) {
          const existingBadges = user.badges || []
          console.log(`[GameServer] Existing badges count: ${existingBadges.length}`, existingBadges)
          
          // Check if badge already earned
          const badgeExists = existingBadges.some(b => b.id === scenario.badge.id)
          console.log(`[GameServer] Badge already exists: ${badgeExists}`)
          
          if (!badgeExists) {
            const badgeWithTimestamp = {
              ...scenario.badge,
              earnedAt: new Date().toISOString()
            }
            existingBadges.push(badgeWithTimestamp)
            awardedBadge = badgeWithTimestamp
            
            console.log(`[GameServer] Saving badge to Firebase:`, badgeWithTimestamp)
            
            await userRef.update({
              badges: existingBadges
            })
            
            console.log(`[GameServer] ✓✓✓ Badge awarded and saved: ${scenario.badge.name}`)
          } else {
            console.log(`[GameServer] ⚠️ Badge already earned, skipping duplicate`)
          }
        } else {
          console.log(`[GameServer] ⚠️ User not found in Firebase for badge save`)
        }
      } else {
        console.log(`[GameServer] Badge not awarded - First Scene Completion: ${isFirstSceneCompletion}, Score: ${scoreToAward}, Has badge def: ${!!scenario?.badge}`)
      }
    } catch (badgeError) {
      console.error('[GameServer] Error awarding badge:', badgeError)
      // Don't fail the mission if badge award fails
    }

    // Fallback to in-memory User model if Firebase fails
    let user = await User.findById(session.userId)
    if (user && !updatedUserStats) {
      user.totalScore = (user.totalScore || 0) + scoreToAward
      user.xp = (user.xp || 0) + xpToAward
      await user.save()
      updatedUserStats = {
        totalScore: user.totalScore,
        currentXP: user.xp,
        level: user.level || 1
      }
    }

    console.log(`[GameServer] Game finished - User: ${session.userId}, SessionScore: ${sessionScore}, ScoreAwarded: ${scoreToAward}, XPAwarded: ${xpToAward}, UpdatedStats:`, updatedUserStats)

    res.json({
      success: true,
      session: {
        id: session._id,
        score: sessionScore,                    // ✅ Show raw score earned in session
        scoreAwarded: scoreToAward,             // ✅ Show actual score added to total (0 if repeat scene)
        xp: xpToAward,                          // ✅ Show XP awarded (always awarded)
        isFirstSceneCompletion: isFirstSceneCompletion,  // ✅ Tell client if this was first scene completion
        sceneId: sceneId,                       // ✅ Echo back sceneId for tracking
        message: isFirstSceneCompletion 
          ? `✅ First scene completion! +${scoreToAward} score, +${xpToAward} XP`
          : `⏭️ Repeat scene. +${xpToAward} XP only (no score)`
      },
      data: {
        userStats: updatedUserStats,
        badge: awardedBadge
      }
    })
  } catch (error) {
    console.error('[GameServer] Error finishing game:', error)
    res.status(500).json({ error: 'Failed to finish game' })
  }
}

/**
 * Log feedback question answer
 */
export const logFeedbackAnswer = async (req, res) => {
  try {
    const { sessionId, actionType, questionType, questionText, selectedIndex, selectedOption, isCorrect } = req.body
    
    if (!sessionId || !actionType) {
      return res.status(400).json({ error: 'Missing sessionId or actionType' })
    }

    const session = await GameSession.findById(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Add feedback answer to session actions
    session.feedbackAnswers = session.feedbackAnswers || []
    session.feedbackAnswers.push({
      actionType,
      questionType,
      questionText,
      selectedIndex,
      selectedOption,
      isCorrect,
      timestamp: new Date()
    })

    await session.save()

    console.log(`[GameServer] Feedback answer logged:`, {
      actionType,
      questionType,
      selectedIndex,
      isCorrect
    })

    res.json({
      success: true,
      actionType,
      questionType,
      selectedIndex,
      isCorrect,
      message: 'Feedback answer logged successfully'
    })
  } catch (error) {
    console.error('[GameServer] Error logging feedback answer:', error)
    res.status(500).json({ error: 'Failed to log feedback answer' })
  }
}

/**
 * Get scenario data
 */
export const getScenario = async (req, res) => {
  try {
    const { scenarioId } = req.params
    
    // Get actual scenario data from scenarioService
    const scenario = getScenarioById(scenarioId)
    
    if (!scenario) {
      return res.status(404).json({ error: `Scenario not found: ${scenarioId}` })
    }
    
    res.json({
      scenario: scenario
    })
  } catch (error) {
    console.error('[GameServer] Error getting scenario:', error)
    res.status(500).json({ error: 'Failed to get scenario' })
  }
}

/**
 * Get all feedback answers for admin analysis (ADMIN ONLY)
 */
export const getAllFeedbackAnswers = async (req, res) => {
  try {
    // Get all game sessions with feedback answers
    const queryResult = await GameSession.find({
      feedbackAnswers: { $exists: true, $ne: [] }
    })
    
    // Call select to get instances (returns array of GameSession instances)
    const sessions = queryResult.select('userId scenarioId feedbackAnswers createdAt')

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        total: 0,
        feedback: []
      })
    }

    // Format feedback data for analysis
    const feedbackData = sessions.flatMap(session => 
      (session.feedbackAnswers || []).map(feedback => ({
        userId: session.userId,
        scenarioId: session.scenarioId,
        sessionId: session._id,
        ...feedback
      }))
    )

    console.log(`[GameServer] Retrieved ${feedbackData.length} feedback answers from ${sessions.length} sessions`)

    res.json({
      success: true,
      total: feedbackData.length,
      sessionCount: sessions.length,
      feedback: feedbackData
    })
  } catch (error) {
    console.error('[GameServer] Error getting feedback answers:', error)
    res.status(500).json({ error: 'Failed to get feedback answers' })
  }
}

/**
 * Get feedback answers for a specific scenario (ADMIN ONLY)
 */
export const getFeedbackByScenario = async (req, res) => {
  try {
    const { scenarioId } = req.params

    const queryResult = await GameSession.find({
      scenarioId,
      feedbackAnswers: { $exists: true, $ne: [] }
    })
    
    const sessions = queryResult.select('userId feedbackAnswers createdAt')

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        scenario: scenarioId,
        total: 0,
        feedback: []
      })
    }

    // Format feedback data
    const feedbackData = sessions.flatMap(session => 
      (session.feedbackAnswers || []).map(feedback => ({
        userId: session.userId,
        sessionId: session._id,
        ...feedback
      }))
    )

    // Calculate statistics
    const stats = {
      total: feedbackData.length,
      byActionType: {},
      byCorrectness: {
        correct: 0,
        incorrect: 0
      }
    }

    feedbackData.forEach(feedback => {
      // Count by action type
      if (!stats.byActionType[feedback.actionType]) {
        stats.byActionType[feedback.actionType] = 0
      }
      stats.byActionType[feedback.actionType]++

      // Count by correctness
      if (feedback.isCorrect) {
        stats.byCorrectness.correct++
      } else {
        stats.byCorrectness.incorrect++
      }
    })

    console.log(`[GameServer] Retrieved ${feedbackData.length} feedback answers for scenario: ${scenarioId}`)

    res.json({
      success: true,
      scenario: scenarioId,
      total: feedbackData.length,
      stats,
      feedback: feedbackData
    })
  } catch (error) {
    console.error('[GameServer] Error getting feedback by scenario:', error)
    res.status(500).json({ error: 'Failed to get feedback by scenario' })
  }
}

/**
 * Get feedback answers for a specific user (ADMIN ONLY)
 */
export const getFeedbackByUser = async (req, res) => {
  try {
    const { userId } = req.params

    const queryResult = await GameSession.find({
      userId,
      feedbackAnswers: { $exists: true, $ne: [] }
    })
    
    const sessions = queryResult.select('scenarioId feedbackAnswers createdAt')

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        user: userId,
        total: 0,
        feedback: []
      })
    }

    // Format feedback data
    const feedbackData = sessions.flatMap(session => 
      (session.feedbackAnswers || []).map(feedback => ({
        scenarioId: session.scenarioId,
        sessionId: session._id,
        ...feedback
      }))
    )

    console.log(`[GameServer] Retrieved ${feedbackData.length} feedback answers for user: ${userId}`)

    res.json({
      success: true,
      user: userId,
      total: feedbackData.length,
      feedback: feedbackData
    })
  } catch (error) {
    console.error('[GameServer] Error getting feedback by user:', error)
    res.status(500).json({ error: 'Failed to get feedback by user' })
  }
}

/**
 * Get feedback questions (PUBLIC - no auth required for now)
 * Supports fetching all questions, or questions for a specific scenario
 */
export const getFeedbackQuestions = async (req, res) => {
  try {
    const { scenario, questionId } = req.query

    let questions

    if (questionId) {
      // Get specific question by ID
      questions = getQuestionById(questionId)
      if (!questions) {
        return res.status(404).json({ error: 'Question not found' })
      }
    } else if (scenario) {
      // Get questions for specific scenario
      questions = getQuestionsByScenario(scenario)
      if (Object.keys(questions).length === 0) {
        return res.status(404).json({ error: 'No questions found for this scenario' })
      }
    } else {
      // Get all questions
      questions = getAllQuestions()
    }

    console.log(`[GameServer] Fetched questions${scenario ? ` for scenario: ${scenario}` : ''}:`, Object.keys(questions))

    res.json({
      success: true,
      questions
    })
  } catch (error) {
    console.error('[GameServer] Error getting feedback questions:', error)
    res.status(500).json({ error: 'Failed to get feedback questions' })
  }
}

/**
 * Get user's ending tracking per mission
 * Analyzes actionTypes in feedbackAnswers to determine which endings player has completed
 */
export const getUserEndingTracking = async (req, res) => {
  try {
    const userId = req.userId  // ✅ Changed from req.user.userId to req.userId

    console.log('[GameServer] Fetching ending tracking for user:', userId)

    // Get all sessions for this user
    const sessions = await GameSession.findByUserId(userId)
    
    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        endingTracking: {
          'phishing-scenario': [],
          'cafe-scenario': []
        }
      })
    }

    // Define ending actionTypes per scenario
    const endingTypesMap = {
      'phishing-scenario': ['reported_phishing', 'deleted_phishing', 'teacher_phishing_confirmed', 'clicked_malicious_link'],
      'cafe-scenario': ['bonus', 'penalty']
    }

    // Track unique endings per mission
    const endingTracking = {
      'phishing-scenario': new Set(),
      'cafe-scenario': new Set()
    }

    // Analyze all sessions and collect endings
    sessions.forEach(session => {
      const scenarioId = session.scenarioId
      const endingTypes = endingTypesMap[scenarioId] || []

      if (session.feedbackAnswers && Array.isArray(session.feedbackAnswers)) {
        session.feedbackAnswers.forEach(feedback => {
          if (endingTypes.includes(feedback.actionType)) {
            endingTracking[scenarioId].add(feedback.actionType)
          }
        })
      }
    })

    // Convert Sets to Arrays for JSON response
    const result = {}
    Object.keys(endingTracking).forEach(missionId => {
      result[missionId] = Array.from(endingTracking[missionId])
    })

    console.log('[GameServer] User ending tracking:', result)

    res.json({
      success: true,
      endingTracking: result
    })
  } catch (error) {
    console.error('[GameServer] Error fetching ending tracking:', error)
    res.status(500).json({ error: 'Failed to fetch ending tracking' })
  }
}

export default {
  startGame,
  logGameAction,
  finishGame,
  logFeedbackAnswer,
  getScenario,
  getAllFeedbackAnswers,
  getFeedbackByScenario,
  getFeedbackByUser,
  getFeedbackQuestions,
  getUserEndingTracking
}