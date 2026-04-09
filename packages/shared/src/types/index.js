/**
 * Shared Types / Interfaces
 * Used across game-engine, game-client, game-server
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {number} level
 * @property {number} xp
 * @property {number} currentMission
 * @property {string[]} completedMissions
 * @property {number} totalScore
 * @property {string} createdAt
 * @property {string} lastPlayedAt
 */

/**
 * @typedef {Object} Mission
 * @property {string} id
 * @property {number} order
 * @property {string} title
 * @property {string} description
 * @property {string} difficulty
 * @property {number} xpReward
 * @property {number} scoreReward
 * @property {Object} content
 * @property {Object} [correctAnswers]
 * @property {number} [passingScore]
 * @property {number} [timeLimit]
 */

/**
 * @typedef {Object} MissionResult
 * @property {boolean} passed
 * @property {number} percentage
 * @property {number} score
 * @property {number} correct
 * @property {number} total
 * @property {number} xpReward
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} width
 * @property {number} height
 * @property {string} parent
 * @property {string} backgroundColor
 * @property {Object} physics
 * @property {Object} scale
 */

/**
 * @typedef {Object} GameClientConfig
 * @property {string} apiUrl
 * @property {string} gameContainer
 * @property {string} uiContainer
 */

export const Types = {
  Player: 'Player',
  Mission: 'Mission',
  MissionResult: 'MissionResult',
  GameConfig: 'GameConfig',
  GameClientConfig: 'GameClientConfig'
}

export default Types
