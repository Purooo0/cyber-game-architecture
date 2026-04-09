/**
 * User Model
 * Stores user profile and game stats
 */

// In-memory storage for development
const users = new Map()

export class User {
  constructor(data) {
    this._id = data._id || data.userId || this.generateId()
    this.userId = data.userId || this._id
    this.username = data.username || 'Player'
    this.totalScore = data.totalScore || 0
    this.xp = data.xp || 0
    this.level = data.level || 1
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async save() {
    this.updatedAt = new Date()
    users.set(this._id, {
      _id: this._id,
      userId: this.userId,
      username: this.username,
      totalScore: this.totalScore,
      xp: this.xp,
      level: this.level,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
    console.log(`[User] Saved user: ${this._id}`)
    return this
  }

  static async findById(id) {
    const data = users.get(id)
    if (!data) return null
    return new User(data)
  }

  static async findByUsername(username) {
    const data = Array.from(users.values()).find(u => u.username === username)
    if (!data) return null
    return new User(data)
  }

  static async create(userData) {
    const user = new User(userData)
    await user.save()
    return user
  }
}

// Development helper
export function getAllUsers() {
  return Array.from(users.values())
}

export function clearAllUsers() {
  users.clear()
  console.log('[User] All users cleared')
}
