/**
 * GameSession Model
 * Stores game session data with actions and scores
 */

// In-memory storage for development
const sessions = new Map()

export class GameSession {
  constructor(data) {
    this._id = data._id || this.generateId()
    this.userId = data.userId
    this.scenarioId = data.scenarioId
    this.sceneId = data.sceneId || null  // ✅ NEW: Track which scene is being played
    this.score = data.score || 0
    this.actions = data.actions || []
    this.feedbackAnswers = data.feedbackAnswers || []  // ✅ Track feedback answers
    this.startedAt = data.startedAt || new Date()
    this.completedAt = data.completedAt || null
  }

  generateId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async save() {
    const dataToSave = {
      _id: this._id,
      userId: this.userId,
      scenarioId: this.scenarioId,
      sceneId: this.sceneId,  // ✅ NEW: Save scene ID
      score: this.score,
      actions: this.actions,
      feedbackAnswers: this.feedbackAnswers,  // ✅ Save feedback answers
      startedAt: this.startedAt,
      completedAt: this.completedAt
    }
    sessions.set(this._id, dataToSave)
    console.log(`[GameSession] Saved session: ${this._id}, scenario=${this.scenarioId}, scene=${this.sceneId}, score=${this.score}, actions=${this.actions.length}, feedback=${this.feedbackAnswers.length}`)
    return this
  }

  static async findById(id) {
    const data = sessions.get(id)
    if (!data) {
      console.log(`[GameSession] Session not found: ${id}`)
      return null
    }
    console.log(`[GameSession] Found session: ${id}, score=${data.score}, actions=${data.actions.length}`)
    return new GameSession(data)
  }

  static async findByUserId(userId) {
    const userSessions = Array.from(sessions.values()).filter(s => s.userId === userId)
    return userSessions.map(data => new GameSession(data))
  }

  static async find(query = {}) {
    let results = Array.from(sessions.values())
    
    // Filter by scenarioId if provided
    if (query.scenarioId) {
      results = results.filter(s => s.scenarioId === query.scenarioId)
    }
    
    // Filter by userId if provided
    if (query.userId) {
      results = results.filter(s => s.userId === query.userId)
    }
    
    // Handle feedbackAnswers filter: { $exists: true, $ne: [] }
    if (query.feedbackAnswers) {
      if (query.feedbackAnswers.$exists && query.feedbackAnswers.$ne) {
        results = results.filter(s => s.feedbackAnswers && s.feedbackAnswers.length > 0)
      }
    }
    
    const instances = results.map(data => new GameSession(data))
    
    // Return a QueryBuilder-like object that supports chaining
    return {
      instances,
      select: function(fields) {
        // fields parameter is ignored for in-memory storage
        // just return the instances as-is
        return instances
      }
    }
  }
}

// Development helper to clear sessions
export function clearAllSessions() {
  sessions.clear()
  console.log('[GameSession] All sessions cleared')
}

// Export sessions map for debugging
export function getAllSessions() {
  return Array.from(sessions.values())
}
