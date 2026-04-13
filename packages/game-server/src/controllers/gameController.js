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

          // ✅ Also mark scenario as completed for the first time (used by dashboard)
          const completedMissionsByScenario = user.completedMissionsByScenario || {}
          const alreadyCounted = !!completedMissionsByScenario[session.scenarioId]
          const completedMissions = Number(user.completedMissions || 0)

          const updates = {
            completedEndings,
            completedMissionsByScenario: {
              ...completedMissionsByScenario,
              [session.scenarioId]: true,
            },
            completedMissions: alreadyCounted ? completedMissions : (completedMissions + 1),
          }

          await userRef.update(updates)
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

    // ✅ Analytics event: store raw run data in Firebase for admin metrics
    try {
      const completedAt = session.completedAt ? new Date(session.completedAt).getTime() : Date.now()
      const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : null
      const durationMs = startedAt ? Math.max(0, completedAt - startedAt) : null

      // Determine success/fail by endingId naming convention if possible
      const ending = (endingId || '').toLowerCase()

      // Mission 2 uses bonus/penalty as ending identifiers
      // (bonus = success, penalty = fail)
      const isSuccess = ending === 'bonus'
        ? true
        : ending === 'penalty'
          ? false
          : (ending.includes('good') || ending.includes('success') || ending.includes('safe'))
            ? true
            : (ending.includes('bad') || ending.includes('fail') || ending.includes('phished') ? false : null)

      const runRef = db.ref('analytics/runs').push()
      await runRef.set({
        runId: runRef.key,
        userId,
        scenarioId: session.scenarioId,
        sessionId: session._id?.toString?.() || session._id,
        endingId: endingId || null,
        isSuccess,
        sessionScore,
        scoreAwarded: scoreToAward,
        xpAwarded: xpToAward,
        startedAt: startedAt ? new Date(startedAt).toISOString() : null,
        completedAt: new Date(completedAt).toISOString(),
        durationMs,
        createdAt: new Date().toISOString(),
      })
    } catch (analyticsError) {
      console.error('[GameServer] Analytics run logging error:', analyticsError)
      // Do not fail the request
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
    const answerTimestamp = new Date()
    session.feedbackAnswers.push({
      actionType,
      questionType,
      questionText,
      selectedIndex,
      selectedOption,
      isCorrect,
      timestamp: answerTimestamp
    })

    await session.save()

    // ✅ Analytics event: store raw feedback answer data in Firebase
    try {
      const answerRef = db.ref('analytics/feedbackAnswers').push()
      await answerRef.set({
        answerId: answerRef.key,
        userId: session.userId,
        scenarioId: session.scenarioId,
        sessionId: session._id?.toString?.() || session._id,
        actionType,
        questionType: questionType || null,
        questionText: questionText || null,
        selectedIndex: typeof selectedIndex === 'number' ? selectedIndex : null,
        selectedOption: selectedOption || null,
        isCorrect: !!isCorrect,
        timestamp: answerTimestamp.toISOString(),
        createdAt: new Date().toISOString(),
      })
    } catch (analyticsError) {
      console.error('[GameServer] Analytics feedback logging error:', analyticsError)
      // Do not fail the request
    }

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
  const safeEmpty = {
    'phishing-scenario': [],
    'cafe-scenario': [],
  }

  try {
    const userId = req.userId
    console.log('[GameServer] Fetching ending tracking for user:', userId)

    // Define known endings per scenario
    const endingTypesMap = {
      'phishing-scenario': ['reported_phishing', 'deleted_phishing', 'teacher_phishing_confirmed', 'clicked_malicious_link'],
      'cafe-scenario': ['bonus', 'penalty'],
    }

    // 1) Primary: Firebase completedEndings
    try {
      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once('value')
      const user = snapshot && typeof snapshot.val === 'function' ? snapshot.val() : null

      const completedEndings = user && typeof user === 'object' ? user.completedEndings : null

      if (completedEndings && typeof completedEndings === 'object') {
        const result = { ...safeEmpty }
        for (const scenarioId of Object.keys(result)) {
          const allowed = endingTypesMap[scenarioId] || []
          const list = Array.isArray(completedEndings[scenarioId]) ? completedEndings[scenarioId] : []
          result[scenarioId] = Array.from(new Set(list.filter(e => allowed.includes(e))))
        }

        return res.json({ success: true, endingTracking: result })
      }
    } catch (fbError) {
      // Firebase misconfig shouldn't bring down the endpoint
      console.error('[GameServer] completedEndings Firebase read failed:', fbError)
    }

    // 2) Fallback: analyze feedbackAnswers in sessions
    try {
      const sessions = await GameSession.findByUserId(userId)
      if (!sessions || sessions.length === 0) {
        return res.json({ success: true, endingTracking: safeEmpty })
      }

      const sets = {
        'phishing-scenario': new Set(),
        'cafe-scenario': new Set(),
      }

      for (const session of sessions) {
        const scenarioId = session?.scenarioId
        if (!scenarioId || !sets[scenarioId]) continue

        const allowed = endingTypesMap[scenarioId] || []
        const answers = session?.feedbackAnswers
        if (!Array.isArray(answers)) continue

        for (const f of answers) {
          const actionType = f?.actionType
          if (actionType && allowed.includes(actionType)) {
            sets[scenarioId].add(actionType)
          }
        }
      }

      const result = {
        'phishing-scenario': Array.from(sets['phishing-scenario']),
        'cafe-scenario': Array.from(sets['cafe-scenario']),
      }

      return res.json({ success: true, endingTracking: result })
    } catch (fallbackErr) {
      console.error('[GameServer] endingTracking fallback failed:', fallbackErr)
      return res.json({ success: true, endingTracking: safeEmpty })
    }
  } catch (error) {
    console.error('[GameServer] Error fetching ending tracking (safe):', error)
    return res.json({ success: true, endingTracking: safeEmpty })
  }
}

/**
 * Get admin analytics data (ADMIN ONLY)
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { scenarioId, userId, from, to } = req.query

    const fromMs = from ? new Date(String(from)).getTime() : null
    const toMs = to ? new Date(String(to)).getTime() : null

    const inRange = (iso) => {
      if (!iso) return true
      const t = new Date(iso).getTime()
      if (Number.isFinite(fromMs) && t < fromMs) return false
      if (Number.isFinite(toMs) && t > toMs) return false
      return true
    }

    const runsSnap = await db.ref('analytics/runs').once('value')
    const answersSnap = await db.ref('analytics/feedbackAnswers').once('value')

    let runs = Object.values(runsSnap.val() || {})
    let answers = Object.values(answersSnap.val() || {})

    // filter by optional params
    if (scenarioId) {
      runs = runs.filter(r => r.scenarioId === scenarioId)
      answers = answers.filter(a => a.scenarioId === scenarioId)
    }
    if (userId) {
      runs = runs.filter(r => r.userId === userId)
      answers = answers.filter(a => a.userId === userId)
    }

    // filter by date range
    runs = runs.filter(r => inRange(r.completedAt || r.createdAt))
    answers = answers.filter(a => inRange(a.timestamp || a.createdAt))

    const perScenario = {}
    const perUser = {}

    const ensureScenario = (sid) => {
      if (!perScenario[sid]) {
        perScenario[sid] = {
          scenarioId: sid,
          runs: 0,
          success: 0,
          failed: 0,
          unknownOutcome: 0,
          totalSessionScore: 0,
          avgSessionScore: 0,
          totalDurationMs: 0,
          avgDurationMs: 0,
          medianDurationMs: 0,
          _durations: [],
          feedbackTotal: 0,
          feedbackCorrect: 0,
          feedbackIncorrect: 0,
          feedbackCorrectPct: 0,
        }
      }
      return perScenario[sid]
    }

    const ensureUser = (uid) => {
      if (!perUser[uid]) perUser[uid] = { userId: uid, runs: 0, success: 0, failed: 0, totalSessionScore: 0, totalDurationMs: 0 }
      return perUser[uid]
    }

    const allDurations = []

    // aggregate runs
    for (const r of runs) {
      const s = ensureScenario(r.scenarioId || 'unknown')
      s.runs += 1
      s.totalSessionScore += Number(r.sessionScore || 0)

      if (typeof r.durationMs === 'number') {
        s.totalDurationMs += r.durationMs
        s._durations.push(r.durationMs)
        allDurations.push(r.durationMs)
      }

      if (r.isSuccess === true) s.success += 1
      else if (r.isSuccess === false) s.failed += 1
      else s.unknownOutcome += 1

      const u = ensureUser(r.userId || 'unknown')
      u.runs += 1
      u.totalSessionScore += Number(r.sessionScore || 0)
      if (typeof r.durationMs === 'number') u.totalDurationMs += r.durationMs
      if (r.isSuccess === true) u.success += 1
      else if (r.isSuccess === false) u.failed += 1
    }

    const median = (arr) => {
      const xs = arr.filter(n => typeof n === 'number' && Number.isFinite(n)).sort((a, b) => a - b)
      if (xs.length === 0) return 0
      const mid = Math.floor(xs.length / 2)
      return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid]
    }

    // finalize scenario averages + median
    for (const sid of Object.keys(perScenario)) {
      const s = perScenario[sid]
      s.avgSessionScore = s.runs > 0 ? s.totalSessionScore / s.runs : 0
      s.avgDurationMs = s.runs > 0 ? s.totalDurationMs / s.runs : 0
      s.medianDurationMs = median(s._durations)
      delete s._durations
    }

    // aggregate feedback answers
    const feedbackByActionType = {}
    for (const a of answers) {
      const sid = a.scenarioId || 'unknown'
      const s = ensureScenario(sid)
      s.feedbackTotal += 1
      if (a.isCorrect) s.feedbackCorrect += 1
      else s.feedbackIncorrect += 1

      const at = a.actionType || 'unknown'
      if (!feedbackByActionType[at]) feedbackByActionType[at] = { total: 0, correct: 0, incorrect: 0 }
      feedbackByActionType[at].total += 1
      if (a.isCorrect) feedbackByActionType[at].correct += 1
      else feedbackByActionType[at].incorrect += 1

      ensureUser(a.userId || 'unknown')
    }

    for (const sid of Object.keys(perScenario)) {
      const s = perScenario[sid]
      s.feedbackCorrectPct = s.feedbackTotal > 0 ? (s.feedbackCorrect / s.feedbackTotal) * 100 : 0
    }

    const overallMedianDurationMs = median(allDurations)

    // overall metrics
    const overall = {
      runsTotal: runs.length,
      feedbackTotal: answers.length,
      feedbackCorrect: answers.filter(a => !!a.isCorrect).length,
      feedbackIncorrect: answers.filter(a => !a.isCorrect).length,
      feedbackCorrectPct: answers.length ? (answers.filter(a => !!a.isCorrect).length / answers.length) * 100 : 0,
      avgSessionScoreOverall: runs.length ? runs.reduce((sum, r) => sum + Number(r.sessionScore || 0), 0) / runs.length : 0,
      avgDurationMsOverall: runs.length ? runs.reduce((sum, r) => sum + Number(r.durationMs || 0), 0) / runs.length : 0,
      medianDurationMsOverall: overallMedianDurationMs,
      successPctOverall: runs.length ? (runs.filter(r => r.isSuccess === true).length / runs.length) * 100 : 0,
      failedPctOverall: runs.length ? (runs.filter(r => r.isSuccess === false).length / runs.length) * 100 : 0,
      feedbackByActionType,
    }

    // scenario score comparison (only for known scenario IDs)
    const scenarioScoreTotals = Object.fromEntries(
      Object.entries(perScenario).map(([sid, s]) => [sid, s.totalSessionScore])
    )

    res.json({
      success: true,
      filters: { scenarioId: scenarioId || null, userId: userId || null, from: from || null, to: to || null },
      overall,
      byScenario: perScenario,
      byUser: perUser,
      scenarioScoreTotals,
      rawCounts: { runs: runs.length, feedbackAnswers: answers.length },
    })
  } catch (error) {
    console.error('[GameServer] Error generating admin analytics:', error)
    res.status(500).json({ error: 'Failed to generate analytics' })
  }
}

/**
 * Get admin raw analytics data (ADMIN ONLY)
 */
export const getAdminAnalyticsRaw = async (req, res) => {
  try {
    const { type } = req.query
    if (type !== 'runs' && type !== 'feedbackAnswers') {
      return res.status(400).json({ error: 'Invalid type. Use runs or feedbackAnswers' })
    }

    const snap = await db.ref(`analytics/${type}`).once('value')
    const rows = Object.values(snap.val() || {})
    res.json({ success: true, type, total: rows.length, rows })
  } catch (error) {
    console.error('[GameServer] Error getting raw analytics:', error)
    res.status(500).json({ error: 'Failed to get raw analytics' })
  }
}

// ✅ Keep default export for compatibility with routes importing gameController as default
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
  getUserEndingTracking,
  getAdminAnalytics,
  getAdminAnalyticsRaw,
}