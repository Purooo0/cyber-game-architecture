'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  Trophy,
  Star,
  Lock,
  CheckCircle2,
  Settings,
  LogOut,
  BarChart3,
  Crown,
  RotateCw,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  useUserProfile, 
  useUserStats, 
  useUserBadges, 
  useAvailableMissions, 
  useLeaderboard,
  useUserEndingTracking
} from '../../hooks/useDashboard'

interface DashboardPageProps {
  onNavigate?: (page: string, scenarioId?: string) => void
  onLogout?: () => void
  userName?: string
  user?: {
    id: string
    email: string
    username: string
    level?: number
    totalScore?: number
    rank?: string
  }
}

export const DashboardPage: React.FC<DashboardPageProps> = React.memo(({ 
  onNavigate, 
  onLogout,
  userName = 'CyberNinja_47',
  user
}) => {
  const [token, setToken] = useState<string | null>(null)
  
  // ✅ Define endings per mission
  const missionsEndingMap: Record<string, number> = {
    'phishing-scenario': 4,  // Mission 1: 4 endings (report, delete, phishing_form, classroom_teacher)
    'cafe-scenario': 2,       // Mission 2: 2 endings (evil_twin, cafe_corner_safe)
  }

  // Fetch data from backend
  const profileData = useUserProfile(token)
  const statsData = useUserStats(token)
  const { badges, loading: badgesLoading } = useUserBadges(token)
  const { missions: allMissions, completedCount: completedMissions, loading: missionsLoading } = useAvailableMissions(token)  // ✅ Pass token!
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(3)
  const { endingTracking, loading: endingTrackingLoading } = useUserEndingTracking(token)  // ✅ Fetch ending tracking

  // ✅ Stable admin check: prefer backend profile email, fallback to prop user
  const isAdmin = useMemo(() => {
    const email = profileData.profile?.email || user?.email
    const result = email === 'admin26@gmail.com'
    console.log('[DashboardPage] isAdmin check:', { email, isAdmin: result })
    return result
  }, [profileData.profile?.email, user?.email])
  
  // Sync token from localStorage on mount and when it changes
  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    setToken(authToken)
    console.log('[DashboardPage] Token synced:', authToken ? '✓ Present' : '✗ Missing')
  }, [])
  
  // Mock notifications data
  
  const markAllAsRead = () => {
    // Notification feature removed
  }

  // Extract refetch functions
  const { profile, refetch: refetchProfile } = profileData
  const { stats, refetch: refetchStats } = statsData

  // Refetch data on mount (only once)
  useEffect(() => {
    console.log('[DashboardPage] Component mounted, refetching data...')
    refetchProfile()
    refetchStats()
  }, []) // Empty dependency array - run only on mount

  // Listen for visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[DashboardPage] Page became visible - refetching data')
        refetchProfile()
        refetchStats()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, []) // Empty dependency array - event listener set up once

  // ✅ Filter out mission 3 (social-challenge) - only show mission 1 & 2
  const missions = useMemo(() => {
    return allMissions.filter(m => m.id !== 'social-challenge')
  }, [allMissions])

  // Fallback data if loading
  const playerData = {
    name: profile?.username || userName,
    level: stats?.level || profile?.level || 1,
    currentXP: stats?.currentXP || profile?.currentXP || 0,
    xpToNextLevel: stats?.xpToNextLevel || profile?.xpToNextLevel || 1000,
    totalScore: stats?.totalScore || profile?.totalScore || 0,
    rank: profile?.rank || 'Rookie',
    badgesEarned: stats?.badgesEarned || profile?.badgesEarned || 0,
    completedMissions: stats?.completedMissions || completedMissions || 0,
    totalMissions: stats?.totalMissions || missions.length || 15
  }

  console.log('[DashboardPage] playerData:', playerData);
  console.log('[DashboardPage] stats from hook:', stats);
  console.log('[DashboardPage] profile from hook:', profile);

  const xpPercentage = (playerData.currentXP / playerData.xpToNextLevel) * 100
  const completionPercentage = (playerData.completedMissions / playerData.totalMissions) * 100
  
  // Calculate cyber awareness based on missions (simplified: completion % + badge count)
  const cyberAwarenessScore = Math.round((completionPercentage * 0.7) + (Math.min(badges.length / 5, 1) * 30))
  
  // Calculate skill level based on level and badges
  const skillLevelScore = Math.round((playerData.level / 50) * 100 * 0.5 + (Math.min(badges.length / 10, 1) * 50))

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Easy': return 'text-primary border-primary bg-primary/10'
      case 'Medium': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10'
      case 'Hard': return 'text-destructive border-destructive bg-destructive/10'
      default: return 'text-foreground/50 border-foreground/20'
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Pixel stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b-2 border-primary/30 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary pixel-border flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="font-pixel text-primary text-sm md:text-base tracking-wider">
                CYBERQUEST
              </h1>
            </button>

            {/* Player Info & Actions */}
            <div className="flex items-center gap-4">
              {/* Player Avatar & Info */}
              <div className="hidden md:flex items-center gap-3 bg-card border-2 border-primary/30 px-4 py-2 rounded">
                <div className="w-10 h-10 bg-secondary/20 border-2 border-secondary rounded flex items-center justify-center">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-pixel text-xs text-foreground">{playerData.name}</p>
                  <p className="text-[10px] text-foreground/60">LVL {playerData.level} - {playerData.rank}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate?.('settings')}
                >
                  <Settings className="w-5 h-5 text-foreground" />
                </Button>
              </div>

              {/* ✅ Admin Feedback Link - Only for admin */}
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onNavigate?.('admin-feedback')}
                  title="View player feedback responses (Admin Only)"
                >
                  <BarChart3 className="w-5 h-5 text-accent animate-pulse" />
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={() => { onLogout?.(); onNavigate?.('landing'); }}>
                <LogOut className="w-5 h-5 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Player Overview Panel */}
        <Card className="bg-card/95 backdrop-blur-sm border-4 border-primary/40 p-6 md:p-8 mb-8 relative overflow-hidden animate-pulse-glow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
          
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-secondary" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-secondary" />

          <div className="relative grid md:grid-cols-3 gap-6">
            {/* Agent Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-secondary" />
                <span className="font-pixel text-xs text-secondary">{'>> AGENT STATUS'}</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-foreground/70">Agent Name</p>
                <p className="font-pixel text-lg text-foreground">{playerData.name}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground/70">Rank</p>
                <Badge className="bg-primary/20 text-primary border-2 border-primary font-pixel text-xs">
                  {playerData.rank}
                </Badge>
              </div>
            </div>

            {/* XP & Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-pixel text-xs text-primary">{'>> LEVEL & XP'}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-2xl text-primary">LVL {playerData.level}</span>
                  <span className="text-sm text-foreground/70">
                    {playerData.currentXP} / {playerData.xpToNextLevel} XP
                  </span>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={xpPercentage} 
                    className="h-3 bg-background/50 border border-primary/30"
                  />
                  <p className="text-xs text-foreground/60 font-pixel">
                    {Math.round(xpPercentage)}% TO NEXT LEVEL
                  </p>
                </div>
              </div>
            </div>

            {/* Score & Badges */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="font-pixel text-xs text-accent">{'>> ACHIEVEMENTS'}</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground/70">Total Score</p>
                <p className="font-pixel text-2xl text-foreground">{playerData.totalScore.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground/70">Badges Earned</p>
                <div className="flex gap-2">
                  {badges.slice(0, 4).map((badge) => (
                    <div 
                      key={badge.id}
                      className="w-8 h-8 bg-background/50 border border-primary/20 rounded flex items-center justify-center"
                    >
                      <span className="text-xl">{badge.icon}</span>
                    </div>
                  ))}
                  {badges.length > 4 && (
                    <div className="w-8 h-8 bg-background/50 border border-primary/20 rounded flex items-center justify-center">
                      <span className="text-xs text-foreground/70">+{badges.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mission Selection Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-xl md:text-2xl text-secondary">
                {'>> AVAILABLE MISSIONS'}
              </h2>
              <Badge className="bg-secondary/20 text-secondary border-2 border-secondary font-pixel text-xs">
                {playerData.completedMissions} / {playerData.totalMissions} COMPLETED
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {missionsLoading ? (
                <div className="col-span-2 text-center py-12">
                  <p className="text-foreground/60">Loading missions...</p>
                </div>
              ) : missions.length > 0 ? (
                missions.map((mission) => {
                  // ✅ Calculate ending counter for this mission from real data
                  const totalEndings = missionsEndingMap[mission.id] || 0
                  const completedEndings = (endingTracking[mission.id] || []).length
                  const allEndingsComplete = totalEndings > 0 && completedEndings === totalEndings
                  const hasAnyEnding = completedEndings > 0
                  
                  return (
                    <Card
                      key={mission.id}
                      className={`bg-card border-2 p-6 relative overflow-hidden transition-all hover:scale-105 group ${
                        mission.locked 
                          ? 'border-foreground/20 opacity-60' 
                          : mission.completed
                          ? 'border-primary/30 hover:border-primary/50'
                          : 'border-secondary/30 hover:border-secondary/50'
                      }`}
                    >
                      {!mission.locked && !mission.completed && (
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      <div className="relative space-y-4">
                        <div className="flex items-start justify-between">
                          <div className={`w-12 h-12 rounded flex items-center justify-center ${
                            mission.locked ? 'bg-foreground/10 border border-foreground/20' :
                            mission.completed ? 'bg-primary/20 border-2 border-primary' :
                            'bg-secondary/20 border-2 border-secondary'
                          }`}>
                            {mission.locked ? (
                              <Lock className="w-6 h-6 text-foreground/40" />
                            ) : mission.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-primary" />
                            ) : (
                              <Shield className="w-6 h-6 text-secondary" />
                            )}
                          </div>
                          
                          <Badge className={`${getDifficultyColor(mission.difficulty)} font-pixel text-[10px] border`}>
                            {mission.difficulty.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-pixel text-sm text-foreground">
                            {mission.title}
                          </h3>
                          <p className="text-xs text-foreground/70 leading-relaxed">
                            {mission.description}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          className={`w-full font-pixel text-xs ${
                            mission.locked
                              ? 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                              : allEndingsComplete
                              ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500 hover:bg-yellow-500 hover:text-yellow-950'
                              : (mission.completed || hasAnyEnding)
                              ? 'bg-primary/20 text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                          }`}
                          disabled={mission.locked}
                          onClick={() => onNavigate?.('simulation', mission.id)}
                        >
                          {mission.locked ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              LOCKED
                            </>
                          ) : allEndingsComplete ? (
                            <>
                              <RotateCw className="w-4 h-4 mr-2" />
                              RETRY
                            </>
                          ) : (mission.completed || hasAnyEnding) ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              REPLAY
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              START MISSION
                            </>
                          )}
                        </Button>

                        {/* ✅ Ending Counter - Show X/Y endings (di bawah button) */}
                        {totalEndings > 0 && (
                          <div className="p-2 bg-background/50 border border-foreground/20 rounded text-center">
                            <p className="text-xs text-foreground/70">
                              Endings: <span className="font-pixel text-foreground">{completedEndings}/{totalEndings}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-foreground/60">No missions available</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Achievements & Stats */}
          <div className="space-y-6">
            {/* Latest Badge */}
            <Card className="bg-card border-2 border-accent/30 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent" />
                  <span className="font-pixel text-xs text-accent">{'>> LATEST BADGE'}</span>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-20 h-20 bg-accent/20 border-2 border-accent rounded flex items-center justify-center mb-3">
                    {badgesLoading ? (
                      <span className="text-foreground/40">...</span>
                    ) : badges.length > 0 ? (
                      <span className="text-3xl">{badges[badges.length - 1].icon}</span>
                    ) : (
                      <Crown className="w-12 h-12 text-accent" />
                    )}
                  </div>
                  <p className="font-pixel text-sm text-foreground text-center">
                    {badgesLoading ? 'Loading...' : badges.length > 0 ? badges[badges.length - 1].name : 'No Badge Yet'}
                  </p>
                  <p className="text-xs text-foreground/60 text-center mt-1">
                    {badgesLoading ? 'Loading...' : badges.length > 0 ? badges[badges.length - 1].description : 'Complete missions to earn badges'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Leaderboard Preview */}
            <Card className="bg-card border-2 border-primary/30 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="font-pixel text-xs text-primary">{'>> LEADERBOARD'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {leaderboardLoading ? (
                    <p className="text-center text-foreground/60 py-4">Loading leaderboard...</p>
                  ) : leaderboard.length > 0 ? (
                    leaderboard.map((player) => (
                      <div 
                        key={player.rank}
                        className="flex items-center justify-between p-3 bg-background/50 border border-primary/20 rounded hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded flex items-center justify-center font-pixel text-xs ${
                            player.rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                            player.rank === 2 ? 'bg-foreground/20 text-foreground/70' :
                            'bg-accent/20 text-accent'
                          }`}>
                            {player.rank}
                          </div>
                          <span className="text-sm text-foreground">{player.name}</span>
                        </div>
                        <span className="font-pixel text-xs text-primary">
                          {player.score.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-foreground/60 py-4">No leaderboard data</p>
                  )}
                </div>

                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-pixel text-xs bg-transparent"
                  onClick={() => onNavigate?.('leaderboard')}
                >
                  VIEW FULL LEADERBOARD
                </Button>
              </div>
            </Card>

            {/* Progress Tracker */}
            <Card className="bg-card border-2 border-secondary/30 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-secondary" />
                  <span className="font-pixel text-xs text-secondary">{'>> PROGRESS TRACKER'}</span>
                </div>

                <div className="space-y-4">
                  {/* Missions Completed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Missions Completed</span>
                      <span className="font-pixel text-xs text-foreground">
                        {Math.round(completionPercentage)}%
                      </span>
                    </div>
                    <Progress 
                      value={completionPercentage} 
                      className="h-2 bg-background/50 border border-secondary/30"
                    />
                  </div>

                  {/* Cyber Awareness Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Cyber Awareness</span>
                      <span className="font-pixel text-xs text-primary">{Math.min(cyberAwarenessScore, 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(cyberAwarenessScore, 100)} 
                      className="h-2 bg-background/50 border border-primary/30"
                    />
                  </div>

                  {/* Skill Level */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Skill Level</span>
                      <span className="font-pixel text-xs text-accent">{Math.min(skillLevelScore, 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(skillLevelScore, 100)} 
                      className="h-2 bg-background/50 border border-accent/30"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-foreground/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/70">Overall Rating</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-foreground/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
})

// Set display name for React.memo
DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
