/**
 * API Service for game client
 * Handles all communication with backend API
 */

interface GameClientConfig {
  apiUrl: string
}

interface LoginResponse {
  success: boolean
  token?: string
  user?: User
  message?: string
}

interface RegisterResponse {
  success: boolean
  user?: User
  message?: string
}

interface User {
  id: string
  email: string
  username: string
  level?: number
  totalScore?: number
  rank?: string
}

export class GameClientService {
  private apiUrl: string

  constructor(config: GameClientConfig) {
    this.apiUrl = config.apiUrl
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      const token = this.getAuthToken()
      if (token) {
        // Ensure correct Bearer format
        const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        headers['Authorization'] = authValue
        console.debug('[API] Authorization header set with token:', authValue.substring(0, 30) + '...')
      } else {
        console.debug('[API] No token available for authorization header')
      }
    }

    return headers
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      
      // Log successful token reception
      if (data.token) {
        console.log('[API] Login successful, token received:', data.token.substring(0, 20) + '...')
      }
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Failed to connect to server' }
    }
  }

  async register(email: string, password: string, username: string): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ email, password, username }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, message: 'Failed to connect to server' }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAuthToken()
      // If no token, don't even attempt fetch
      if (!token) {
        console.debug('[API] No auth token found in storage')
        return null
      }

      console.debug('[API] Attempting to fetch user profile with token:', token.substring(0, 20) + '...')
      
      const response = await fetch(`${this.apiUrl}/api/user/profile`, {
        method: 'GET',
        headers: this.getHeaders(true),
      })

      console.debug('[API] User profile response status:', response.status)

      if (!response.ok) {
        // 401 Unauthorized is expected if token is invalid/expired
        // Don't log as error - it's a normal auth check flow
        if (response.status === 401) {
          // Log for debugging without showing as error
          console.debug('[Auth] Token invalid/expired - clearing storage')
          // Clear invalid token silently
          localStorage.removeItem('authToken')
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      // Network errors or other unexpected errors
      return null
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(true),
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async getMissions() {
    try {
      const response = await fetch(`${this.apiUrl}/api/user/missions`, {
        method: 'GET',
        headers: this.getHeaders(false),
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get missions error:', error)
      return []
    }
  }

  async getBadges() {
    try {
      const response = await fetch(`${this.apiUrl}/api/user/badges`, {
        method: 'GET',
        headers: this.getHeaders(true),
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get badges error:', error)
      return []
    }
  }

  async getStats() {
    try {
      const response = await fetch(`${this.apiUrl}/api/user/stats`, {
        method: 'GET',
        headers: this.getHeaders(true),
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get stats error:', error)
      return null
    }
  }

  async getLeaderboard() {
    try {
      const response = await fetch(`${this.apiUrl}/api/user/leaderboard`, {
        method: 'GET',
        headers: this.getHeaders(false),
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get leaderboard error:', error)
      return []
    }
  }
}

export default GameClientService
