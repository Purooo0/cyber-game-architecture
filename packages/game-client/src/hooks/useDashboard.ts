import { useState, useEffect, useCallback, useRef } from 'react'
import { API_URL } from '../lib/api'

// ✅ OPTIMIZATION: Request deduplication & caching
const requestCacheRef = {
  profile: { data: null as any, timestamp: 0, loading: false, promise: null as Promise<any> | null },
  stats: { data: null as any, timestamp: 0, loading: false, promise: null as Promise<any> | null },
  badges: { data: null as any, timestamp: 0, loading: false, promise: null as Promise<any> | null },
  missions: { data: null as any, timestamp: 0, loading: false, promise: null as Promise<any> | null },
  leaderboard: { data: null as any, timestamp: 0, loading: false, promise: null as Promise<any> | null },
  endingTracking: { data: null as any, timestamp: 0, loading: false, promise: null as Promise<any> | null },
}

const CACHE_DURATION = 30000 // 30 seconds cache (prevents multiple simultaneous requests)

export interface UserProfile {
  id: string
  username: string
  email: string
  level: number
  currentXP: number
  xpToNextLevel: number
  totalScore: number
  rank: string
  badgesEarned: number
  completedMissions: number
  createdAt: number
}

export interface UserStats {
  totalScore: number
  level: number
  currentXP: number
  xpToNextLevel: number
  completedMissions: number
  totalMissions: number
  badgesEarned: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: string
}

export interface Mission {
  id: string
  title: string
  description: string
  difficulty: string
  locked: boolean
  completed: boolean
  topic: string
}

export interface LeaderboardEntry {
  rank: number
  name: string
  userId: string
  score: number
  level: number
}

/**
 * Hook untuk fetch user profile with caching & deduplication
 * 401 = token invalid/expired → clear token, treat as guest
 * Now includes refetch function to manually refresh profile
 * ✅ OPTIMIZATION: Cache + request deduplication prevents multiple calls
 */
export const useUserProfile = (token?: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!token) {
      console.log('[useUserProfile] No token provided, skipping fetch')
      setLoading(false)
      return
    }

    const now = Date.now()
    const cache = requestCacheRef.profile

    // Check cache (return cached data if still valid)
    if (cache.data && now - cache.timestamp < CACHE_DURATION && !cache.loading) {
      console.log('[useUserProfile] ✅ Using cached profile (still fresh)')
      setProfile(cache.data)
      setLoading(false)
      return
    }

    // If already loading, wait for pending request instead of duplicating
    if (cache.loading && cache.promise) {
      console.log('[useUserProfile] ⏳ Request already in progress, waiting...')
      try {
        const result = await cache.promise
        setProfile(result)
        setError(null)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
      return
    }

    console.log('[useUserProfile] 🔄 Fetching fresh profile data')
    cache.loading = true
    cache.promise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('[useUserProfile] Response status:', response.status)

        if (response.status === 401) {
          console.log('[useUserProfile] 401 Unauthorized - clearing token')
          localStorage.removeItem('authToken')
          cache.data = null
          cache.timestamp = 0
          cache.loading = false
          setProfile(null)
          setError(null)
          setLoading(false)
          return null
        }
        if (!response.ok) throw new Error('Failed to fetch profile')

        const data = await response.json()
        cache.data = data.profile
        cache.timestamp = now
        cache.loading = false
        cache.promise = null
        setProfile(data.profile)
        setError(null)
        return data.profile
      } catch (err) {
        cache.loading = false
        cache.promise = null
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        setProfile(null)
        throw err
      } finally {
        setLoading(false)
      }
    })()

    return await cache.promise
  }, [token])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, error, refetch: fetchProfile }
}

/**
 * Hook untuk fetch user stats with caching & deduplication
 * 401 = token invalid/expired → clear token, treat as guest
 * Now includes refetch function to manually refresh stats
 * ✅ OPTIMIZATION: Cache + request deduplication prevents multiple calls
 */
export const useUserStats = (token?: string | null) => {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!token) {
      console.log('[useUserStats] No token provided, skipping fetch')
      setLoading(false)
      return
    }

    const now = Date.now()
    const cache = requestCacheRef.stats

    // Check cache
    if (cache.data && now - cache.timestamp < CACHE_DURATION && !cache.loading) {
      console.log('[useUserStats] ✅ Using cached stats (still fresh)')
      setStats(cache.data)
      setLoading(false)
      return
    }

    // If already loading, wait for pending request
    if (cache.loading && cache.promise) {
      console.log('[useUserStats] ⏳ Request already in progress, waiting...')
      try {
        const result = await cache.promise
        setStats(result)
        setError(null)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
      return
    }

    console.log('[useUserStats] 🔄 Fetching fresh stats data')
    cache.loading = true
    cache.promise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('[useUserStats] Response status:', response.status)

        if (response.status === 401) {
          console.log('[useUserStats] 401 Unauthorized - clearing token')
          localStorage.removeItem('authToken')
          cache.data = null
          cache.timestamp = 0
          cache.loading = false
          setStats(null)
          setError(null)
          setLoading(false)
          return null
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        console.log('[useUserStats] Response data:', data)
        cache.data = data.stats
        cache.timestamp = now
        cache.loading = false
        cache.promise = null
        setStats(data.stats)
        console.log('[useUserStats] ✓ Stats updated:', data.stats)
        setError(null)
        return data.stats
      } catch (err) {
        cache.loading = false
        cache.promise = null
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        setStats(null)
        throw err
      } finally {
        setLoading(false)
      }
    })()

    return await cache.promise
  }, [token])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

/**
 * Hook untuk fetch user badges
 * 401 = token invalid/expired → clear token, treat as guest
 */
export const useUserBadges = (token?: string | null) => {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBadges = useCallback(async () => {
    if (!token) {
      console.log('[useUserBadges] No token provided, skipping fetch')
      setLoading(false)
      return
    }

    console.log('[useUserBadges] Fetching with token:', token.substring(0, 20) + '...')
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/user/badges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('[useUserBadges] Response status:', response.status)

      if (response.status === 401) {
        console.log('[useUserBadges] 401 Unauthorized - clearing token')
        localStorage.removeItem('authToken')
        setBadges([])
        setError(null)
        setLoading(false)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch badges')

      const data = await response.json()
      console.log('[useUserBadges] Badges fetched:', data.badges)
      setBadges(data.badges || [])
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useUserBadges] Error:', errorMsg)
      setError(errorMsg)
      setBadges([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  return { badges, loading, error, refetch: fetchBadges }
}

/**
 * Hook untuk fetch available missions/scenarios
 * Now protected - requires auth token to track completion
 */
export const useAvailableMissions = (token?: string | null) => {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    const fetchMissions = async () => {
      // ✅ Skip if no token (user not logged in)
      if (!token) {
        console.log('[useAvailableMissions] No token provided, skipping fetch')
        setLoading(false)
        return
      }

      try {
        console.log('[useAvailableMissions] Fetching missions with auth')
        // ✅ Missions endpoint now requires auth
        const response = await fetch(`${API_URL}/api/user/missions`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,  // ✅ Send token!
          },
        })

        console.log('[useAvailableMissions] Missions response status:', response.status)

        if (!response.ok) {
          throw new Error(`Failed to fetch missions: ${response.status}`)
        }

        const data = await response.json()
        console.log('[useAvailableMissions] Missions data:', data)
        setMissions(data.missions || [])
        setCompletedCount(data.completedCount || 0)
        setError(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[useAvailableMissions] Error fetching missions:', errorMsg)
        setError(errorMsg)
        setMissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchMissions()
  }, [token])  // ✅ Refetch when token changes

  return { missions, completedCount, loading, error }
}

/**
 * Hook untuk fetch global leaderboard
 */
export const useLeaderboard = (limit: number = 10) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/leaderboard?limit=${limit}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }

        const data = await response.json()
        setLeaderboard(data.leaderboard)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLeaderboard([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit])

  return { leaderboard, loading, error }
}

/**
 * Hook untuk fetch user's ending tracking per mission
 * Shows which endings player has completed for each mission
 */
export const useUserEndingTracking = (token?: string | null) => {
  const [endingTracking, setEndingTracking] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEndingTracking = async () => {
      if (!token) {
        console.log('[useUserEndingTracking] No token provided, skipping fetch')
        setEndingTracking({})
        setError(null)
        setLoading(false)
        return
      }

      try {
        console.log('[useUserEndingTracking] Fetching with token:', token.substring(0, 20) + '...')
        const response = await fetch(`${API_URL}/api/game/user/endings`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        console.log('[useUserEndingTracking] Response status:', response.status)

        if (response.status === 401) {
          console.log('[useUserEndingTracking] 401 Unauthorized - clearing token')
          localStorage.removeItem('authToken')
          setEndingTracking({})
          setError(null)
          setLoading(false)
          return
        }

        if (!response.ok) {
          // Don't throw: server might return HTML error pages that break JSON parsing in callers.
          const body = await response.text().catch(() => '')
          console.error('[useUserEndingTracking] Non-ok response body (first 200 chars):', body.substring(0, 200))
          setEndingTracking({})
          setError(`Failed to fetch ending tracking: ${response.status}`)
          return
        }

        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const body = await response.text().catch(() => '')
          console.error('[useUserEndingTracking] Unexpected content-type:', contentType, 'body (first 200):', body.substring(0, 200))
          setEndingTracking({})
          setError('Unexpected response format')
          return
        }

        const data = await response.json()
        console.log('[useUserEndingTracking] Ending tracking data:', data)
        setEndingTracking(data.endingTracking || {})
        setError(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[useUserEndingTracking] Error fetching ending tracking:', errorMsg)
        setError(errorMsg)
        setEndingTracking({})
      } finally {
        setLoading(false)
      }
    }

    fetchEndingTracking()
  }, [token])

  return { endingTracking, loading, error }
}
