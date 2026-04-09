import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { 
  Shield, 
  Trophy,
  Medal,
  Crown,
  Star,
  ArrowLeft,
  Settings,
  Bell,
  Search,
  TrendingUp,
  Award,
  Zap,
  Target,
  ChevronUp
} from 'lucide-react'
import { useLeaderboard, useUserStats, useUserProfile } from '../../hooks/useDashboard'

interface LeaderboardPageProps {
  onNavigate?: (page: string) => void
  currentPlayerName?: string
}


export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ 
  onNavigate,
  currentPlayerName = 'Agent_X'
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [token, setToken] = useState<string | null>(null)
  
  // Fetch leaderboard data
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(50)
  
  // Fetch current player stats
  const { stats: userStats } = useUserStats(token)
  const { profile: userProfile } = useUserProfile(token)
  
  // Sync token from localStorage on mount
  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    setToken(authToken)
  }, [])
  
  // Get top 3 players
  const topThree = leaderboard.slice(0, 3)
  
  // Get remaining players (rank 4+)
  const remainingPlayers = leaderboard.slice(3)
  
  // Get current player's rank from leaderboard or default values
  const currentPlayerRank = leaderboard.find(p => p.userId === userProfile?.id)
  const playerRank = currentPlayerRank?.rank || 999
  const playerScore = userStats?.totalScore || 0
  const playerLevel = userStats?.level || 1
  const playerBadges = userStats?.badgesEarned || 0
  
  // Calculate next rank player (one rank higher)
  const nextRankPlayer = leaderboard.find(p => p.rank === playerRank - 1)
  const pointsToNextRank = nextRankPlayer ? Math.max(0, nextRankPlayer.score - playerScore) : 0

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Pixel stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
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

      {/* Floating code particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-primary font-pixel text-xs animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {Math.random() > 0.5 ? '01' : '10'}
          </div>
        ))}
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b-2 border-primary/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Back */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate?.('dashboard')}
                className="text-foreground hover:text-primary font-pixel text-xs bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary pixel-border flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="font-pixel text-primary text-xs md:text-sm tracking-wider hidden sm:block">
                  CYBERQUEST
                </h1>
              </div>
            </div>

            {/* Right: Player Info & Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-card border-2 border-primary/30 rounded">
                <div className="w-8 h-8 bg-secondary/20 border border-secondary rounded flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="font-pixel text-[10px] text-foreground">{userProfile?.username || currentPlayerName}</p>
                  <p className="text-[10px] text-foreground/60">LVL {playerLevel}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="icon" className="relative bg-transparent">
                <Bell className="w-5 h-5 text-foreground/70 hover:text-primary transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
              </Button>
              
              <Button variant="ghost" size="icon" className="bg-transparent">
                <Settings className="w-5 h-5 text-foreground/70 hover:text-primary transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-secondary/20 text-secondary border-2 border-secondary font-pixel text-xs px-4 py-2">
            {'>> COMPETITIVE RANKING'}
          </Badge>
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/20 border-2 border-primary rounded flex items-center justify-center animate-pulse-glow">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="font-pixel text-3xl md:text-5xl text-primary mb-4 leading-tight">
            GLOBAL CYBER
            <br />
            <span className="text-secondary">RANKINGS</span>
          </h1>
          
          <p className="text-foreground/70 text-base md:text-lg">
            {'Compete. Defend. Rise in Rank.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-5xl mx-auto mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
              <Input
                type="text"
                placeholder="Search player by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-background/50 border-2 border-primary/30 text-foreground h-12 font-sans focus:border-primary"
              />
            </div>
          </Card>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Top 3 Podium */}
            <div>
              <h2 className="font-pixel text-xl text-secondary mb-8 text-center">
                {'>> TOP CYBER DEFENDERS'}
              </h2>
              
              {/* Podium Layout: 2nd, 1st, 3rd */}
              <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 items-end">
                {/* Reorder: 2nd (left), 1st (center), 3rd (right) */}
                {topThree.map((player, idx) => {
                  const isFirst = player.rank === 1
                  const colorMap: Record<number, any> = {
                    1: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: Crown },
                    2: { border: 'border-slate-300', bg: 'bg-slate-300/10', text: 'text-slate-300', icon: Medal },
                    3: { border: 'border-amber-600', bg: 'bg-amber-600/10', text: 'text-amber-600', icon: Award }
                  }
                  const colors = colorMap[player.rank] || colorMap[1]
                  const Icon = colors.icon

                  return (
                    <Card
                      key={player.rank}
                      className={`relative border-4 ${colors.border} ${colors.bg} p-6 md:p-8 transition-all hover:scale-105 ${
                        isFirst ? 'md:order-2' : player.rank === 2 ? 'md:order-1 md:mt-8' : 'md:order-3 md:mt-8'
                      } group`}
                    >
                      {/* Rank badge */}
                      <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 ${colors.bg} border-2 ${colors.border} rounded-full flex items-center justify-center z-10`}>
                        <span className={`font-pixel text-base ${colors.text}`}>#{player.rank}</span>
                      </div>

                      <div className="space-y-4 text-center pt-4">
                        {/* Icon */}
                        <div className={`w-20 h-20 mx-auto ${colors.bg} border-2 ${colors.border} rounded-full flex items-center justify-center group-hover:animate-pulse-glow`}>
                          <Icon className={`w-12 h-12 ${colors.text}`} />
                        </div>

                        {/* Player info */}
                        <div>
                          <h3 className="font-pixel text-base text-foreground mb-2">{player.name}</h3>
                          <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[10px] font-pixel px-3 py-1`}>
                            LVL {player.level}
                          </Badge>
                        </div>

                        {/* Score */}
                        <div className={`pt-4 border-t ${colors.border}`}>
                          <p className="text-xs text-foreground/60 mb-2">Total Score</p>
                          <p className={`font-pixel text-xl ${colors.text}`}>{player.score.toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Full Ranking List */}
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 overflow-hidden">
              <div className="p-4 border-b-2 border-primary/30 bg-primary/5">
                <h2 className="font-pixel text-sm text-primary">
                  {'>> FULL RANKINGS'}
                </h2>
              </div>

              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border-b border-primary/20 bg-background/50">
                <div className="col-span-1 font-pixel text-[10px] text-foreground/70">RANK</div>
                <div className="col-span-4 font-pixel text-[10px] text-foreground/70">PLAYER</div>
                <div className="col-span-2 font-pixel text-[10px] text-foreground/70">LEVEL</div>
                <div className="col-span-3 font-pixel text-[10px] text-foreground/70">SCORE</div>
                <div className="col-span-2 font-pixel text-[10px] text-foreground/70">BADGES</div>
              </div>

              {/* Table Rows */}
              <div className="max-h-[500px] overflow-y-auto">
                {remainingPlayers.map((player, idx) => {
                  const isCurrentPlayer = player.userId === userProfile?.id
                  return (
                    <div
                      key={player.rank}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-primary/10 transition-all hover:bg-primary/5 ${
                        isCurrentPlayer ? 'bg-primary/10 border-primary/50 border-2' : idx % 2 === 0 ? 'bg-background/30' : 'bg-background/10'
                      }`}
                    >
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-pixel text-sm text-primary">#{player.rank}</span>
                            <span className="font-pixel text-sm text-foreground">{player.name}</span>
                          </div>
                          {isCurrentPlayer && (
                            <Badge className="bg-primary/20 text-primary border border-primary font-pixel text-[8px]">
                              YOU
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-foreground/70">
                          <span>LVL {player.level}</span>
                          <span className="font-pixel">{player.score.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:contents">
                        <div className="col-span-1 flex items-center">
                          <span className="font-pixel text-sm text-primary">#{player.rank}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary/20 border border-secondary rounded flex items-center justify-center">
                            <Shield className="w-4 h-4 text-secondary" />
                          </div>
                          <span className="font-pixel text-sm text-foreground">{player.name}</span>
                          {isCurrentPlayer && (
                            <Badge className="bg-primary/20 text-primary border border-primary font-pixel text-[8px]">
                              YOU
                            </Badge>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Badge className="bg-background/50 text-foreground border border-primary/30 text-xs">
                            LVL {player.level}
                          </Badge>
                        </div>
                        <div className="col-span-3 flex items-center">
                          <span className="font-pixel text-sm text-foreground">{player.score.toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground/70">{player.score.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar: Player Rank Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Player Card */}
            <Card className="bg-card border-2 border-secondary/30 p-6 sticky top-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
              
              <div className="space-y-4">
                <div className="text-center">
                  <Badge className="bg-secondary/20 text-secondary border border-secondary font-pixel text-[10px] mb-3">
                    YOUR RANK
                  </Badge>
                  <div className="w-16 h-16 mx-auto bg-secondary/20 border-2 border-secondary rounded-full flex items-center justify-center mb-3">
                    <Shield className="w-10 h-10 text-secondary" />
                  </div>
                  <h3 className="font-pixel text-lg text-foreground mb-1">{userProfile?.username || currentPlayerName}</h3>
                  <p className="text-xs text-foreground/60">Level {playerLevel}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-secondary/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-foreground/70">Current Rank</span>
                    <span className="font-pixel text-sm text-primary">#{playerRank}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-foreground/70">Total Score</span>
                    <span className="font-pixel text-sm text-foreground">{playerScore.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-foreground/70">Badges</span>
                    <span className="font-pixel text-sm text-foreground">{playerBadges}</span>
                  </div>
                </div>

                {nextRankPlayer && (
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-pixel text-[10px] text-foreground/70">NEXT RANK</span>
                      <span className="font-pixel text-[10px] text-secondary">#{playerRank - 1}</span>
                    </div>
                    <div className="h-2 bg-background/50 border border-secondary/30 rounded overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all" 
                        style={{ width: playerScore > 0 ? `${Math.min((playerScore / nextRankPlayer.score) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                    <p className="text-[10px] text-foreground/50 mt-1">{pointsToNextRank.toLocaleString()} points to next rank</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LeaderboardPage
