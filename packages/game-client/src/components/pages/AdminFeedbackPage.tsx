import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Filter, Search } from 'lucide-react'
import { API_URL } from '../../lib/api'

interface FeedbackAnswer {
  userId: string
  scenarioId: string
  sessionId: string
  actionType: string
  questionType: string
  questionText: string
  selectedIndex: number
  selectedOption: string
  isCorrect: boolean
  timestamp: string
}

interface AnalyticsScenarioRow {
  scenarioId: string
  runs: number
  success: number
  failed: number
  unknownOutcome: number
  totalSessionScore: number
  avgSessionScore: number
  totalDurationMs: number
  avgDurationMs: number
  medianDurationMs: number
  feedbackTotal: number
  feedbackCorrect: number
  feedbackIncorrect: number
  feedbackCorrectPct: number
}

interface AdminAnalyticsResponse {
  success: boolean
  overall: {
    runsTotal: number
    feedbackTotal: number
    feedbackCorrect: number
    feedbackIncorrect: number
    feedbackCorrectPct: number
    avgSessionScoreOverall: number
    avgDurationMsOverall: number
    medianDurationMsOverall: number
    successPctOverall: number
    failedPctOverall: number
    feedbackByActionType: Record<string, { total: number; correct: number; incorrect: number }>
  }
  byScenario: Record<string, AnalyticsScenarioRow>
  byUser: Record<string, { userId: string; runs: number; success: number; failed: number; totalSessionScore: number; totalDurationMs: number }>
  scenarioScoreTotals: Record<string, number>
}

export default function AdminFeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<FeedbackAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterScenario, setFilterScenario] = useState<string>('all')
  const [filterActionType, setFilterActionType] = useState<string>('all')
  const [searchUser, setSearchUser] = useState<string>('')
  const [viewMode, setViewMode] = useState<'all' | 'scenario' | 'user'>('all')

  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    fetchFeedbackAndAnalytics()
  }, [viewMode, filterScenario])

  const fetchFeedbackAndAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No token found')
        return
      }

      // 1) Raw feedback answers (Firebase-backed; persistent)
      const rawResp = await fetch(`${API_URL}/api/game/admin/analytics/raw?type=feedbackAnswers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (rawResp.ok) {
        const raw = await rawResp.json()
        const rows = (raw.rows || []) as FeedbackAnswer[]
        setFeedbackData(rows)
      } else {
        console.error('Failed to fetch raw feedback answers')
      }

      // 2) Aggregated analytics (new)
      const analyticsQuery = new URLSearchParams()
      if (filterScenario !== 'all') analyticsQuery.set('scenarioId', filterScenario)
      const analyticsResp = await fetch(`${API_URL}/api/game/admin/analytics?${analyticsQuery.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (analyticsResp.ok) {
        const a = await analyticsResp.json()
        setAnalytics(a)
      } else {
        console.error('Failed to fetch analytics')
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = feedbackData.filter(item => {
    const matchesScenario = filterScenario === 'all' || item.scenarioId === filterScenario
    const matchesAction = filterActionType === 'all' || item.actionType === filterActionType
    const matchesUser = searchUser === '' || item.userId.toLowerCase().includes(searchUser.toLowerCase())
    return matchesScenario && matchesAction && matchesUser
  })

  const uniqueScenarios = Array.from(new Set(feedbackData.map(f => f.scenarioId)))
  const uniqueActionTypes = Array.from(new Set(feedbackData.map(f => f.actionType)))

  const scenarioComparison = useMemo(() => {
    const totals = analytics?.scenarioScoreTotals || {}
    const s1 = totals['phishing-scenario'] ?? totals['emergency-school'] ?? 0
    const s2 = totals['cafe-wifi'] ?? totals['wifi-cafe'] ?? totals['scenario2'] ?? 0
    return { s1, s2, relation: s1 === s2 ? 'equal' : (s1 < s2 ? 's1_lt_s2' : 's1_gt_s2') }
  }, [analytics])

  const downloadCSV = () => {
    const headers = [
      'User ID',
      'Scenario',
      'Action Type',
      'Question',
      'Selected Answer',
      'Is Correct',
      'Timestamp'
    ]

    const rows = filteredData.map(item => [
      item.userId,
      item.scenarioId,
      item.actionType,
      `"${item.questionText}"`,
      `"${item.selectedOption}"`,
      item.isCorrect ? 'Yes' : 'No',
      new Date(item.timestamp).toLocaleString()
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const downloadRunsRaw = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return
    const resp = await fetch(`${API_URL}/api/game/admin/analytics/raw?type=runs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!resp.ok) return
    const data = await resp.json()

    const headers = ['runId','userId','scenarioId','sessionId','endingId','isSuccess','sessionScore','scoreAwarded','xpAwarded','startedAt','completedAt','durationMs']
    const rows = (data.rows || []).map((r: any) => headers.map(h => {
      const v = r[h]
      return typeof v === 'string' ? `"${v.replace(/"/g,'""')}"` : String(v ?? '')
    }).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `runs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // helper formatter
  const formatDuration = (ms?: number) => {
    const v = typeof ms === 'number' && Number.isFinite(ms) ? ms : 0
    const totalSec = Math.round(v / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}m ${String(s).padStart(2, '0')}s`
  }

  const resetAnalytics = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const ok = window.confirm('Reset semua data analytics? Ini akan menghapus Runs dan Feedback Answers yang sudah terkumpul.')
    if (!ok) return

    setIsResetting(true)
    try {
      const resp = await fetch(`${API_URL}/api/game/admin/analytics/reset`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        console.error('Failed to reset analytics:', body)
        alert('Reset gagal. Cek console / server logs.')
        return
      }

      // Refresh UI
      await fetchFeedbackAndAnalytics()
    } catch (e) {
      console.error('Error resetting analytics:', e)
      alert('Reset gagal. Cek console / server logs.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-pixel text-primary">📊 ADMIN METRICS</h1>
              <p className="text-foreground/70">Global + per-scenario + raw data export</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={resetAnalytics}
                variant="destructive"
                disabled={isResetting}
                title="Delete all analytics (runs + feedback answers)"
              >
                {isResetting ? 'Resetting...' : 'Reset Analytics'}
              </Button>

              <Button
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-900"
                onClick={() => {
                  // safest: hard navigation to root/dashboard so it works even if router state is lost
                  window.location.assign('/')
                }}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-primary/10 border-primary">
              <div className="text-sm font-pixel text-foreground/60">Runs Total</div>
              <div className="text-3xl font-pixel text-primary mt-2">{analytics.overall.runsTotal}</div>
              <div className="text-xs text-foreground/50 mt-1">Avg time: {formatDuration(analytics.overall.avgDurationMsOverall)}</div>
            </Card>
            <Card className="p-4 bg-green-500/10 border-green-500">
              <div className="text-sm font-pixel text-foreground/60">Feedback Correct %</div>
              <div className="text-3xl font-pixel text-green-500 mt-2">{analytics.overall.feedbackCorrectPct.toFixed(1)}%</div>
              <div className="text-xs text-foreground/50 mt-1">({analytics.overall.feedbackCorrect}/{analytics.overall.feedbackTotal})</div>
            </Card>
            <Card className="p-4 bg-secondary/10 border-secondary">
              <div className="text-sm font-pixel text-foreground/60">Avg Score / Run</div>
              <div className="text-3xl font-pixel text-secondary mt-2">{analytics.overall.avgSessionScoreOverall.toFixed(1)}</div>
            </Card>
            <Card className="p-4 bg-red-500/10 border-red-500">
              <div className="text-sm font-pixel text-foreground/60">Success / Failed</div>
              <div className="text-sm font-pixel text-foreground mt-2">
                {analytics.overall.successPctOverall.toFixed(1)}% / {analytics.overall.failedPctOverall.toFixed(1)}%
              </div>
              <div className="text-xs text-foreground/50 mt-1">(unknown outcomes counted as neither)</div>
            </Card>
          </div>
        )}

        {/* Scenario Comparison */}
        {analytics && (
          <Card className="p-6 space-y-2">
            <div className="text-sm font-pixel text-foreground/70">Scenario Score Totals (akumulasi sessionScore)</div>
            <div className="text-sm text-foreground/80 font-mono">
              Scenario 1 total: {scenarioComparison.s1} | Scenario 2 total: {scenarioComparison.s2}
            </div>
            <div className="text-xs text-foreground/60">
              Relation: {scenarioComparison.relation === 'equal' ? 'Equal' : (scenarioComparison.relation === 's1_lt_s2' ? 'Scenario 1 < Scenario 2' : 'Scenario 1 > Scenario 2')}
            </div>
          </Card>
        )}

        {/* Global KPIs */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Runs Total */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-sm text-slate-400">Runs Total</div>
            <div className="mt-1 text-2xl font-semibold">
              {analytics?.overall ? analytics.overall.runsTotal : '—'}
            </div>
            <div className="mt-2 text-sm text-slate-400">Avg time</div>
            <div className="mt-1 text-lg font-semibold">
              {analytics?.overall ? formatDuration(analytics.overall.avgDurationMsOverall) : '—'}
            </div>
          </div>

          {/* Feedback Correct % */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-sm text-slate-400">Feedback Correct %</div>
            <div className="mt-1 text-2xl font-semibold">
              {analytics?.overall ? `${analytics.overall.feedbackCorrectPct.toFixed(1)}%` : '—'}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              ({analytics?.overall.feedbackCorrect} / {analytics?.overall.feedbackTotal})
            </div>
          </div>

          {/* Avg Score / Run */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-sm text-slate-400">Avg Score / Run</div>
            <div className="mt-1 text-2xl font-semibold">
              {analytics?.overall ? analytics.overall.avgSessionScoreOverall.toFixed(1) : '—'}
            </div>
          </div>

          {/* Success / Failed */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-sm text-slate-400">Success / Failed</div>
            <div className="mt-1 text-2xl font-semibold">
              {analytics?.overall
                ? `${analytics.overall.successPctOverall.toFixed(1)}% / ${analytics.overall.failedPctOverall.toFixed(1)}%`
                : '—'}
            </div>
            <div className="mt-2 text-sm text-slate-400">(unknown outcomes counted as neither)</div>
          </div>

          {/* Duration */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-sm text-slate-400">Avg Duration</div>
            <div className="mt-1 text-2xl font-semibold">
              {analytics?.overall ? formatDuration(analytics.overall.avgDurationMsOverall) : '—'}
            </div>
            <div className="mt-2 text-sm text-slate-400">Median Duration</div>
            <div className="mt-1 text-lg font-semibold">
              {analytics?.overall ? formatDuration(analytics.overall.medianDurationMsOverall) : '—'}
            </div>
          </div>
        </div>

        {/* Per-scenario table */}
        {analytics && (
          <Card className="p-6 overflow-x-auto">
            <h2 className="text-xl font-pixel text-foreground mb-4">Per Scenario</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">Scenario</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Runs</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Avg Score</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Success%</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Failed%</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Avg Time</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Median Time</th>
                  <th className="text-right py-3 px-4 font-pixel text-foreground/70">Feedback Correct%</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(analytics.byScenario || {}).map((s) => {
                  const successPct = s.runs ? (s.success / s.runs) * 100 : 0
                  const failedPct = s.runs ? (s.failed / s.runs) * 100 : 0
                  return (
                    <tr key={s.scenarioId} className="border-b border-primary/10 hover:bg-primary/5">
                      <td className="py-3 px-4 text-foreground/80">{s.scenarioId}</td>
                      <td className="py-3 px-4 text-right text-foreground/80 font-mono">{s.runs}</td>
                      <td className="py-3 px-4 text-right text-foreground/80 font-mono">{s.avgSessionScore.toFixed(1)}</td>
                      <td className="py-3 px-4 text-right text-green-500 font-mono">{successPct.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-red-400 font-mono">{failedPct.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-foreground/80 font-mono">{formatDuration(s.avgDurationMs)}</td>
                      <td className="py-3 px-4 text-right text-foreground/80 font-mono">{formatDuration(s.medianDurationMs)}</td>
                      <td className="py-3 px-4 text-right text-foreground/80 font-mono">{s.feedbackCorrectPct.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-pixel text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filters & Export
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-pixel text-foreground/70 mb-2 block">Scenario</label>
              <select
                value={filterScenario}
                onChange={(e) => setFilterScenario(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-primary/30 rounded text-sm"
              >
                <option value="all">All Scenarios</option>
                {uniqueScenarios.map(scenario => (
                  <option key={scenario} value={scenario}>{scenario}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-pixel text-foreground/70 mb-2 block">Action Type</label>
              <select
                value={filterActionType}
                onChange={(e) => setFilterActionType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-primary/30 rounded text-sm"
              >
                <option value="all">All Types</option>
                {uniqueActionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-pixel text-foreground/70 mb-2 block">Search User</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="User ID..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full px-3 py-2 pl-8 bg-background border border-primary/30 rounded text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <Button onClick={downloadCSV} className="w-full bg-primary text-primary-foreground font-pixel">
                <Download className="w-4 h-4 mr-2" /> Export Feedback CSV
              </Button>
              <Button onClick={downloadRunsRaw} variant="outline" className="w-full font-pixel">
                <Download className="w-4 h-4 mr-2" /> Export Runs CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Raw Feedback Table (existing) */}
        <Card className="p-6 overflow-x-auto">
          <h2 className="text-xl font-pixel text-foreground mb-4">Feedback Raw Data ({filteredData.length})</h2>

          {loading ? (
            <div className="text-center py-8 text-foreground/50">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">No feedback data found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">User</th>
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">Scenario</th>
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">Action</th>
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">Question</th>
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">Answer</th>
                  <th className="text-center py-3 px-4 font-pixel text-foreground/70">Correct</th>
                  <th className="text-left py-3 px-4 font-pixel text-foreground/70">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="border-b border-primary/10 hover:bg-primary/5">
                    <td className="py-3 px-4 text-foreground/80 font-mono text-xs">{item.userId.substring(0, 8)}...</td>
                    <td className="py-3 px-4 text-foreground/80">{item.scenarioId}</td>
                    <td className="py-3 px-4 text-foreground/80 font-mono text-xs">{item.actionType}</td>
                    <td className="py-3 px-4 text-foreground/80 max-w-xs truncate">{item.questionText}</td>
                    <td className="py-3 px-4 text-foreground/80 max-w-xs truncate">{item.selectedOption}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`${item.isCorrect ? 'text-green-500' : 'text-red-500'} font-pixel`}>
                        {item.isCorrect ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/60 text-xs">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
