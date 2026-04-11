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
    const { sessionId, endingId } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' })
    }

    const session = await GameSession.findById(sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // ✅ Persist endingId on session for debugging/analysis (optional)
    if (endingId) {
      session.sceneId = endingId // re-use existing field to avoid schema migration
    }

    session.completedAt = new Date()
    await session.save()

    const sessionScore = session.score || 0

    const userId = session.userId
    let isFirstEndingCompletion = false
    let scoreToAward = 0

    // ✅ XP behavior stays as-is: XP is always awarded based on sessionScore
    const xpToAward = Math.round(sessionScore / 10)

    try {
      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once('value')
      const user = snapshot.val()

      if (user) {
        const completedEndings = user.completedEndings || {}
        const completedForScenario = completedEndings[session.scenarioId] || []

        isFirstEndingCompletion = endingId ? !completedForScenario.includes(endingId) : true
        scoreToAward = isFirstEndingCompletion ? sessionScore : 0

        console.log('[GameServer] 📊 Ending-Level Scoring Check:', {
          scenarioId: session.scenarioId,
          endingId: endingId || 'unknown-ending',
          completedEndings: completedForScenario,
          isFirstEndingCompletion,
          scoreToAward,
          xpToAward,
          sessionScore,
        })

        // ✅ Persist completion ONLY when first time and we have endingId
        if (isFirstEndingCompletion && endingId) {
          completedForScenario.push(endingId)
          completedEndings[session.scenarioId] = completedForScenario
          await userRef.update({ completedEndings })
        }
      } else {
        // If user not found, default to awarding score
        isFirstEndingCompletion = true
        scoreToAward = sessionScore
      }
    } catch (fbError) {
      console.error('[GameServer] Firebase check/update error:', fbError)
      isFirstEndingCompletion = true
      scoreToAward = sessionScore
    }

    // Update user score + XP using Firebase
    let updatedUserStats = null
    let awardedBadge = null

    try {
      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once('value')
      const user = snapshot.val()

      if (user) {
        const newTotalScore = (user.totalScore || 0) + scoreToAward
        let newCurrentXP = (user.currentXP || 0) + xpToAward
        let newLevel = user.level || 1
        let newXpToNextLevel = user.xpToNextLevel || 1000

        while (newCurrentXP >= newXpToNextLevel) {
          newCurrentXP -= newXpToNextLevel
          newLevel += 1
          newXpToNextLevel = Math.ceil(1000 * (1.1 ** (newLevel - 1)))
        }

        if (newCurrentXP < 0) newCurrentXP = 0

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
      }
    } catch (fbError) {
      console.error('[GameServer] Firebase update error:', fbError)
    }

    // ✅ Badge awarding: keep existing behavior, but only award when score awarded (>0)
    try {
      const scenario = getScenarioById(session.scenarioId)
      if (scenario && scenario.badge && scoreToAward > 0) {
        const userRef = db.ref(`users/${session.userId}`)
        const snapshot = await userRef.once('value')
        const user = snapshot.val()

        if (user) {
          const existingBadges = user.badges || []
          const badgeExists = existingBadges.some(b => b.id === scenario.badge.id)

          if (!badgeExists) {
            const badgeWithTimestamp = { ...scenario.badge, earnedAt: new Date().toISOString() }
            existingBadges.push(badgeWithTimestamp)
            awardedBadge = badgeWithTimestamp
            await userRef.update({ badges: existingBadges })
          }
        }
      }
    } catch (badgeError) {
      console.error('[GameServer] Error awarding badge:', badgeError)
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        score: sessionScore,
        scoreAwarded: scoreToAward,
        xp: xpToAward,
        endingId: endingId || null,
        isFirstEndingCompletion,
        message: isFirstEndingCompletion
          ? `✅ First ending completion! +${scoreToAward} score, +${xpToAward} XP`
          : `⏭️ Ending already completed. +${xpToAward} XP only (no score)`,
      },
      data: {
        userStats: updatedUserStats,
        badge: awardedBadge,
      },
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
    const userId = req.userId

    console.log('[GameServer] Fetching ending tracking for user:', userId)

    // Define ending actionTypes per scenario
    const endingTypesMap = {
      'phishing-scenario': ['reported_phishing', 'deleted_phishing', 'teacher_phishing_confirmed', 'clicked_malicious_link'],
      'cafe-scenario': ['bonus', 'penalty'],
    }

    // ✅ 1) Primary source of truth: Firebase users/{userId}/completedEndings
    // This is written by finishGame and is independent of feedback logging.
    let completedEndingsFromFirebase = null
    try {
      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once('value')
      const user = snapshot.val()
      completedEndingsFromFirebase = user?.completedEndings || null
    } catch (fbError) {
      console.error('[GameServer] Error reading completedEndings from Firebase:', fbError)
    }

    const result = {
      'phishing-scenario': [],
      'cafe-scenario': [],
    }

    if (completedEndingsFromFirebase) {
      for (const scenarioId of Object.keys(result)) {
        const allowedEndings = endingTypesMap[scenarioId] || []
        const list = Array.isArray(completedEndingsFromFirebase[scenarioId])
          ? completedEndingsFromFirebase[scenarioId]
          : []

        // Filter to known endings and dedupe
        result[scenarioId] = Array.from(new Set(list.filter(e => allowedEndings.includes(e))))
      }

      console.log('[GameServer] User ending tracking (Firebase completedEndings):', result)
      return res.json({
        success: true,
        endingTracking: result,
      })
    }

    // ✅ 2) Secondary source: Analyze feedbackAnswers in GameSession
    const sessions = await GameSession.find({ userId })
    
    for (const session of sessions) {
      const scenarioId = session.scenarioId
      const allowedEndings = endingTypesMap[scenarioId] || []

      // Analyze feedback answers for ending action types
      const endingActions = (session.feedbackAnswers || []).filter(fa => 
        fa.actionType && allowedEndings.includes(fa.actionType)
      ).map(fa => fa.actionType)

      // Deduplicate and add to result
      result[scenarioId] = Array.from(new Set([...result[scenarioId], ...endingActions]))
    }

    console.log('[GameServer] User ending tracking (feedbackAnswers analysis):', result)

    res.json({
      success: true,
      endingTracking: result,
    })
  } catch (error) {
    console.error('[GameServer] Error fetching user ending tracking:', error)
    res.status(500).json({ error: 'Failed to fetch user ending tracking' })
  }
}