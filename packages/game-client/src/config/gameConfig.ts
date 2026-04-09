/**
 * Game Configuration TypeScript Version
 */

import { API_URL } from '../lib/api'

export interface GameConfig {
  apiUrl: string
  gameContainer: string
  uiContainer: string
  debug: boolean
  width: number
  height: number
  fps: number
  [key: string]: any
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  apiUrl: API_URL,
  gameContainer: '#game-container',
  uiContainer: '#game-ui-container',
  debug: typeof import.meta.env !== 'undefined' && (import.meta.env as any).DEV ? true : false,
  width: 1600,
  height: 900,
  fps: 60
}

export const SCENES = {
  LANDING: 'landing',
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard',
  SIMULATION: 'simulation',
  LEADERBOARD: 'leaderboard',
  SCORING: 'scoring'
} as const

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',

  // User
  USER_PROFILE: '/api/user/profile',
  USER_STATS: '/api/user/stats',
  USER_SETTINGS: '/api/user/settings',

  // Game
  GAME_SCENARIOS: '/api/game/scenarios',
  GAME_SCENARIO: '/api/game/scenarios/:id',
  GAME_PROGRESS: '/api/game/progress',
  GAME_SESSION: '/api/game/session',

  // Scoring
  LEADERBOARD: '/api/leaderboard',
  SCORES: '/api/scores',

  // Actions
  ACTION_LOG: '/api/actions/log'
} as const

export type SceneName = typeof SCENES[keyof typeof SCENES]
