import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Filter, Search } from 'lucide-react'

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

interface FeedbackStats {
  total: number
  byActionType: Record<string, number>
  byCorrectness: {
    correct: number
    incorrect: number
  }
}

export default function AdminFeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<FeedbackAnswer[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterScenario, setFilterScenario] = useState<string>('all')
  const [filterActionType, setFilterActionType] = useState<string>('all')
  const [searchUser, setSearchUser] = useState<string>('')
  const [viewMode, setViewMode] = useState<'all' | 'scenario' | 'user'>('all')

  useEffect(() => {
    fetchFeedback()
  }, [viewMode, filterScenario])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')  // ✅ FIXED: use 'authToken', not 'token'
      if (!token) {
        console.error('No token found')
        return
      }

      let endpoint = '/api/game/admin/feedback/all'
      if (viewMode === 'scenario' && filterScenario !== 'all') {
        endpoint = `/api/game/admin/feedback/scenario/${filterScenario}`
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFeedbackData(data.feedback || [])
        if (data.stats) {
          setStats(data.stats)
        }
        console.log(`✅ Loaded ${data.total} feedback answers`)
      } else {
        console.error('Failed to fetch feedback')
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-pixel text-primary">
            📊 FEEDBACK ANALYSIS
          </h1>
          <p className="text-foreground/70">
            View and analyze player responses to feedback questions
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-primary/10 border-primary">
              <div className="text-sm font-pixel text-foreground/60">Total Responses</div>
              <div className="text-3xl font-pixel text-primary mt-2">{stats.total}</div>
            </Card>
            <Card className="p-4 bg-green-500/10 border-green-500">
              <div className="text-sm font-pixel text-foreground/60">Correct Answers</div>
              <div className="text-3xl font-pixel text-green-500 mt-2">{stats.byCorrectness.correct}</div>
              <div className="text-xs text-foreground/50 mt-1">
                {((stats.byCorrectness.correct / stats.total) * 100).toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4 bg-red-500/10 border-red-500">
              <div className="text-sm font-pixel text-foreground/60">Incorrect Answers</div>
              <div className="text-3xl font-pixel text-red-500 mt-2">{stats.byCorrectness.incorrect}</div>
              <div className="text-xs text-foreground/50 mt-1">
                {((stats.byCorrectness.incorrect / stats.total) * 100).toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4 bg-secondary/10 border-secondary">
              <div className="text-sm font-pixel text-foreground/60">Action Types</div>
              <div className="text-3xl font-pixel text-secondary mt-2">{Object.keys(stats.byActionType).length}</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-pixel text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filters & Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Scenario Filter */}
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

            {/* Action Type Filter */}
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

            {/* User Search */}
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

            {/* Download Button */}
            <div className="flex items-end">
              <Button
                onClick={downloadCSV}
                className="w-full bg-primary text-primary-foreground font-pixel"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="p-6 overflow-x-auto">
          <h2 className="text-xl font-pixel text-foreground mb-4">
            Response Data ({filteredData.length})
          </h2>

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
                      {item.isCorrect ? (
                        <span className="inline-block px-2 py-1 bg-green-500/20 text-green-500 rounded font-pixel text-xs">✓</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-red-500/20 text-red-500 rounded font-pixel text-xs">✗</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-foreground/60 text-xs">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Summary Statistics by Action Type */}
        {stats && Object.keys(stats.byActionType).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-pixel text-foreground mb-4">
              📈 Responses by Action Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.byActionType).map(([actionType, count]) => (
                <div key={actionType} className="p-4 bg-secondary/10 border border-secondary/30 rounded">
                  <div className="font-pixel text-sm text-foreground/70">{actionType}</div>
                  <div className="text-2xl font-pixel text-secondary mt-2">{count}</div>
                  <div className="text-xs text-foreground/50 mt-1">
                    {((count / stats.total) * 100).toFixed(1)}% of responses
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
