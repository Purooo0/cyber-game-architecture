'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Pause,
  X,
  Star,
  Target,
  TrendingUp,
  Play,
  RotateCcw,
  Settings,
  LogOut,
  CheckCircle2,
  Award,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Wifi,
  Lock,
  Zap,
  Monitor,
  Printer,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { PhaserGameContainer } from '../PhaserGameContainer'
import { MentorDialog } from '../mentor-dialog'
import { NPCDialogSystem, type DialogNode } from '../npc-dialog-system'
import { LaptopPopup } from '../laptop-popup'
import { CafeMenuPopup } from '../cafe-menu-popup'
import { API_URL } from '../../lib/api'
import type { TriggerBox, InteractiveObject } from '../../game/types'

interface CafeScenarioPageProps {
  onNavigate?: (page: string) => void
  onLogout?: () => void
  scenarioId?: string
  scenarioTitle?: string
}

/**
 * SCENARIO 2: Cafe WiFi - Evil Twin WiFi & Man-in-the-Middle Attack
 * Map: cafe_map.tmj
 * Spawn Point: spawn_player3
 * NPCs: bartender1, bartender2, npc3
 */
export const CafeScenarioPage: React.FC<CafeScenarioPageProps> = ({
  onNavigate,
  onLogout,
  scenarioId = '2',
  scenarioTitle = 'Wi-Fi Gratis di Kafe Dekat Sekolah'
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [missionResult, setMissionResult] = useState<'success' | 'failed' | null>(null)
  const [missionSessionId, setMissionSessionId] = useState<string | null>(null)  // ✅ Store sessionId with mission result!
  const [isFinishingGame, setIsFinishingGame] = useState(false)  // ✅ Track if finishGame is in progress
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [sessionScoreEarned, setSessionScoreEarned] = useState(0)  // ✅ Track earned score for ending UI
  // ✅ NEW: values returned from finishGame (score limited per-ending; XP always awarded)
  const [endingScoreAwarded, setEndingScoreAwarded] = useState<number | null>(null)
  const [endingXpAwarded, setEndingXpAwarded] = useState<number | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)

  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scenarioData, setScenarioData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)

  // NEW: Intro animation state (step 0 = boot, 1 = skipped, 2 = scenario, 3 = done)
  const [introStep, setIntroStep] = useState(0)
  const [introDone, setIntroDone] = useState(false)
  const [bootText, setBootText] = useState('')

  // Mentor dialog state
  const [mentorLineIdx, setMentorLineIdx] = useState(0)
  const [showMentor, setShowMentor] = useState(true)
  const [mentorHint, setMentorHint] = useState<string | null>(null)

  // NPC dialog system state (for complex dialogs with choices)
  const [showNPCDialogSystem, setShowNPCDialogSystem] = useState(false)
  const [currentNPCDialogNodes, setCurrentNPCDialogNodes] = useState<DialogNode[]>([])
  const [currentNPCStartDialog, setCurrentNPCStartDialog] = useState('')

  // Laptop popup state
  const [showLaptopPopup, setShowLaptopPopup] = useState(false)
  const [npc4DialogDone, setNpc4DialogDone] = useState(false)

  // User's base score before this session (to display total score correctly)
  const [baseUserScore, setBaseUserScore] = useState(0)
  const [userCurrentXP, setUserCurrentXP] = useState(0)
  const [userXPToNextLevel, setUserXPToNextLevel] = useState(1000)
  const [userLevel, setUserLevel] = useState(1)

  // Cafe menu popup state
  const [showCafeMenu, setShowCafeMenu] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastCartData, setLastCartData] = useState<any[]>([])
  const [receiptOnlyMode, setReceiptOnlyMode] = useState(false)

  // Map management state (cafe_map.tmj)
  const [currentMapPath, setCurrentMapPath] = useState('/cafe_map.tmj')
  const [mapLoadingComplete, setMapLoadingComplete] = useState(false)

  // ✅ NEW: Feedback questions state
  const [feedbackQuestions, setFeedbackQuestions] = useState<any>(null)
  const [questionsLoading, setQuestionsLoading] = useState(false)

  // Backend completion error state
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [completionSuccess, setCompletionSuccess] = useState(false)

  // Track canvas position for E indicator positioning
  const [canvasPosition, setCanvasPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Update canvas position when component mounts or layout changes
  useEffect(() => {
    const updateCanvasPosition = () => {
      const phaserContainer = document.getElementById('phaser-game-container')
      if (phaserContainer) {
        const rect = phaserContainer.getBoundingClientRect()
        setCanvasPosition({ x: rect.left, y: rect.top })
        console.log(`[Cafe Canvas Position] Updated to (${rect.left}, ${rect.top})`)
      }
    }

    updateCanvasPosition()
    window.addEventListener('resize', updateCanvasPosition)
    return () => window.removeEventListener('resize', updateCanvasPosition)
  }, [])

  // Mentor lines for Scenario 2 (Cafe WiFi)
  const mentorLines = [
    "Setelah sekolah hari ini, kamu memutuskan untuk belajar di sebuah kafe nyaman dekat kampusmu. Tempat ini sempurna untuk mengerjakan tugas bersama teman-teman!",
    "Sebelum kamu mulai, lihat sekitar dan sapa teman-temanmu yang sudah ada di sini. Mereka mungkin memiliki informasi penting tentang keamanan jaringan yang tersedia.",
  ]

  // Good ending mentor message
  const goodEndingMentorLines = [
    "Luar biasa! Kamu berhasil menghindari jaringan WiFi berbahaya.",
    "Data pribadi dan akun kamu tetap aman dari serangan. Kamu telah belajar untuk selalu waspada dengan jaringan WiFi publik!",
  ]

  // Boot sequence text for scenario 2
  const bootString = '> INISIALISASI SKENARIO KAFE'

  // NEW: Boot text typewriter effect
  useEffect(() => {
    if (introStep !== 0) return
    let i = 0
    const interval = setInterval(() => {
      setBootText(bootString.slice(0, i + 1))
      i++
      if (i >= bootString.length) {
        clearInterval(interval)
        // After boot text finishes, show notification
        setTimeout(() => setIntroStep(1), 800)
      }
    }, 11)  // Typewriter speed: 11ms per character (2x faster)
    return () => clearInterval(interval)
  }, [introStep])

  // NEW: Auto-advance from boot to scenario description after 1s
  useEffect(() => {
    if (introStep !== 1) return
    const t = setTimeout(() => setIntroStep(2), 1000)
    return () => clearTimeout(t)
  }, [introStep])

  // NEW: Continue button handler
  const handleContinue = () => {
    setIntroStep(3)
    setTimeout(() => setIntroDone(true), 600)
  }

  // NEW: Show mentor dialog when game starts (after intro completes)
  useEffect(() => {
    if (introDone) {
      console.log('[CafeScenario] Game started, showing mentor dialog...')
      setMentorLineIdx(0)
      setShowMentor(true)
    }
  }, [introDone])

  // Complete game session when mission result changes
  useEffect(() => {
    if (missionResult) {
      setIsFinishingGame(true)  // ✅ Mark as finishing
      console.log('[CafeScenario] Mission result changed:', missionResult)
      console.log('[CafeScenario] Using missionSessionId:', missionSessionId)  // ✅ Log stored sessionId
      completeScenarioWithBackend(missionResult)
        .then(() => setIsFinishingGame(false))  // ✅ Mark as done
        .catch(() => setIsFinishingGame(false))  // ✅ Mark as done even if error
    }
  }, [missionResult, missionSessionId])  // ✅ Depend on missionSessionId, not gameSessionId

  // Get token dynamically
  const getToken = () => localStorage.getItem('authToken')

  // Initialize game session
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true)

        // Start game session
        const response = await fetch(`${API_URL}/api/game/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ scenarioId }),
        })

        if (!response.ok) {
          throw new Error(`Failed to start game: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[CafeScenario] Game session started:', data)
        setGameSessionId(data.session.id)
        // Session starts at 0, but we track it separately
        setScore(data.session.score || 0)
        setXp(Math.round((data.session.score || 0) / 10))

        // Fetch user stats to get their current base score
        const userResponse = await fetch(`${API_URL}/api/user/stats`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log('[CafeScenario] User stats:', userData)
          setUserStats(userData)
          // Store base score and XP info so we can display total = base + session score
          setBaseUserScore(userData.stats?.totalScore || 0)
          setUserCurrentXP(userData.stats?.currentXP || 0)
          setUserXPToNextLevel(userData.stats?.xpToNextLevel || 1000)
          setUserLevel(userData.stats?.level || 1)
        }

        // ✅ NEW: Fetch feedback questions from backend
        try {
          setQuestionsLoading(true)
          const questionsResponse = await fetch(`${API_URL}/api/game/questions`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          })
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json()
            console.log('[CafeScenario] Feedback questions loaded:', Object.keys(questionsData.questions))
            setFeedbackQuestions(questionsData.questions)
          } else {
            console.warn('[CafeScenario] Failed to fetch feedback questions:', questionsResponse.statusText)
          }
        } catch (error) {
          console.error('[CafeScenario] Error fetching feedback questions:', error)
        } finally {
          setQuestionsLoading(false)
        }

        setLoading(false)
      } catch (error) {
        console.error('[CafeScenario] Init error:', error)
        setLoading(false)
      }
    }

    initializeGame()
  }, [scenarioId])

  // Log action to backend and update score
  const logGameAction = async (actionType: string, value?: any) => {
    if (!gameSessionId) {
      console.warn('[CafeScenario] No game session ID')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/game/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          sessionId: gameSessionId,
          actionType,
          value,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to log action: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[CafeScenario] Action logged:', { actionType, sessionScore: data.sessionScore, scoreEarned: data.scoreEarned })

      // Update UI with new score from session
      setScore(data.sessionScore || 0)
      setXp(Math.round((data.sessionScore || 0) / 10))

      return data
    } catch (error) {
      console.error('[CafeScenario] Log action error:', error)
    }
  }

  // Apply score penalty/bonus for wrong/correct choices
  const applyScorePenalty = async (points: number) => {
    const actionType = points > 0 ? 'bonus' : 'penalty'
    console.log('[CafeScenario] Applying score action:', { actionType, points })
    await logGameAction(actionType, { points })
  }

  // Complete game scenario (use finish endpoint which handles session completion)
  const completeScenarioWithBackend = async (result: 'success' | 'failed') => {
    if (!missionSessionId) {  // ✅ Use missionSessionId instead of gameSessionId
      console.error('[CafeScenario] Cannot complete: No missionSessionId')
      setCompletionError('No game session found')
      return
    }

    const token = getToken()
    if (!token) {
      console.error('[CafeScenario] Cannot complete: No auth token')
      setCompletionError('Your session has expired. Please log in again to save your progress.')
      return
    }

    // ✅ NEW: Infer endingId from mission result (for score limiting)
    // Mission 2 has 2 endings tracked in dashboard: evil_twin vs cafe_corner_safe
    // Backend currently uses 'bonus'/'penalty' as ending identifiers.
    const endingId = result === 'success' ? 'bonus' : 'penalty'

    try {
      // ✅ gate overlay numbers until backend returns
      setIsFinishing(true)
      setEndingScoreAwarded(null)
      setEndingXpAwarded(null)

      console.log('[CafeScenario] Sending game finish to backend...', {
        sessionId: missionSessionId,
        endingId,
        scenarioId,
        score,
        result,
        tokenPresent: !!token,
        completed: result === 'success',
      })

      const response = await fetch(`${API_URL}/api/game/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: missionSessionId,
          endingId,
        }),
      })

      console.log('[CafeScenario] Game finish response:', {
        status: response.status,
        statusText: response.statusText,
      })

      if (response.status === 401) {
        console.error('[CafeScenario] 401 Unauthorized - token may have expired')
        localStorage.removeItem('authToken')
        setCompletionError('Your session has expired. Please log in again to save your progress.')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData?.message || response.statusText
        throw new Error(`Failed to finish game: ${errorMsg}`)
      }

      const data = await response.json()
      console.log('[CafeScenario] Game finished successfully:', data)

      // ✅ Capture backend-awarded values (score can be 0 on replay; XP always awarded)
      if (data?.session) {
        setEndingScoreAwarded(typeof data.session.scoreAwarded === 'number' ? data.session.scoreAwarded : 0)
        setEndingXpAwarded(typeof data.session.xp === 'number' ? data.session.xp : 0)
      } else {
        setEndingScoreAwarded(0)
        setEndingXpAwarded(0)
      }
      
      // Update base user score from finishGame response
      if (data?.data?.userStats) {
        setBaseUserScore(data.data.userStats.totalScore)
        setUserCurrentXP(data.data.userStats.currentXP)
        setUserLevel(data.data.userStats.level)
        setUserXPToNextLevel(data.data.userStats.xpToNextLevel)
        console.log('[CafeScenario] Updated user stats from backend:', data.data.userStats)
      } else {
        // Fallback: manually fetch stats if not in response
        console.log('[CafeScenario] No userStats in finishGame response, fetching separately...')
        const token = getToken()
        if (token) {
          try {
            const statsResponse = await fetch(`${API_URL}/api/user/stats`, {
              headers: { 'Authorization': `Bearer ${token}` },
            })
            if (statsResponse.ok) {
              const statsData = await statsResponse.json()
              console.log('[CafeScenario] Fetched fresh user stats:', statsData.stats)
              setBaseUserScore(statsData.stats?.totalScore || 0)
              setUserCurrentXP(statsData.stats?.currentXP || 0)
              setUserLevel(statsData.stats?.level || 1)
              setUserXPToNextLevel(statsData.stats?.xpToNextLevel || 1000)
            }
          } catch (error) {
            console.error('[CafeScenario] Error fetching user stats:', error)
          }
        }
      }
      
      setCompletionSuccess(true)
      setCompletionError(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[CafeScenario] Finish game error:', errorMsg)
      setCompletionError(errorMsg)
      // Don't throw - still show result overlay even if backend update fails
    } finally {
      setIsFinishing(false)
    }
  }

  // Handle NPC interaction - Bartender 1
  const handleBartender1Interaction = () => {
    console.log('[CafeScenario] Bartender 1 interacted')
    
    const bartender1Nodes: DialogNode[] = [
      {
        id: 'bartender1-greeting',
        speaker: 'Bartender',
        text: 'Halo! Selamat datang di Kafe Corner. Ada yang bisa saya bantu?',
        choices: [
          {
            id: 'choice-wifi-name',
            text: 'Apa nama WiFi resmi kafe ini?',
            nextDialogId: 'bartender1-wifi-answer',
          },
          {
            id: 'choice-skip',
            text: 'Tidak ada, terima kasih.',
            nextDialogId: 'bartender1-wifi-info',
          },
        ],
      },
      {
        id: 'bartender1-wifi-answer',
        speaker: 'Bartender',
        text: 'WiFi resmi kami adalah "CafeCorner" dengan password tertera di atas meja. Berhati-hatilah dengan jaringan WiFi lain yang namanya mirip — itu bisa jadi palsu!',
        choices: [
          {
            id: 'choice-confirm-wifi',
            text: 'Terima kasih! Aku akan hati-hati.',
            nextDialogId: 'bartender1-close-dialog',
          },
        ],
      },
      {
        id: 'bartender1-wifi-info',
        speaker: 'Bartender',
        text: 'WiFi resmi kami bernama "CafeCorner" dan passwordnya harus memesan dulu ya.',
        autoAdvanceDelay: 3000,
        choices: [
          {
            id: 'choice-confirm-wifi-info',
            text: 'Baik, terima kasih.',
            nextDialogId: 'bartender1-close-dialog',
          },
        ],
      },
      {
        id: 'bartender1-close-dialog',
        speaker: 'System',
        text: '',
      },
    ]

    setCurrentNPCDialogNodes(bartender1Nodes)
    setCurrentNPCStartDialog('bartender1-greeting')
    setShowNPCDialogSystem(true)
  }

  // Handle NPC interaction - Bartender 2
  const handleBartender2Interaction = () => {
    console.log('[CafeScenario] Bartender 2 interacted')
    
    const bartender2Nodes: DialogNode[] = [
      {
        id: 'bartender2-greeting',
        speaker: 'Bartender',
        text: 'Halo! Ada yang bisa dipesan?',
        choices: [
          {
            id: 'choice-ask-about-owner',
            text: 'Siapa pemilik WiFi "CafeCorner_free"?',
            nextDialogId: 'bartender2-warning',
          },
          {
            id: 'choice-skip2',
            text: 'Tidak ada, terima kasih.',
            nextDialogId: 'bartender2-close-dialog',
          },
        ],
      },
      {
        id: 'bartender2-warning',
        speaker: 'Bartender',
        text: 'Itu bukan WiFi kami! Jangan terhubung ke jaringan itu — itu kemungkinan milik hacker atau pesaing. Gunakan hanya WiFi resmi kami.',
        choices: [
          {
            id: 'choice-thanks',
            text: 'Terima kasih atas informasinya!',
            nextDialogId: 'bartender2-close-dialog',
          },
        ],
      },
      {
        id: 'bartender2-close-dialog',
        speaker: 'System',
        text: '',
      },
    ]

    setCurrentNPCDialogNodes(bartender2Nodes)
    setCurrentNPCStartDialog('bartender2-greeting')
    setShowNPCDialogSystem(true)
  }

  // Handle NPC interaction - NPC3 (Barista)
  const handleNPC3Interaction = () => {
    console.log('[CafeScenario] NPC3 (Barista) interacted')
    
    const npc3Nodes: DialogNode[] = [
      {
        id: 'npc3-greeting',
        speaker: 'Barista',
        text: 'Halo! Selamat datang di CafePixel. Ada yang bisa kami bantu untuk Anda hari ini?',
        choices: [
          {
            id: 'choice-order',
            text: 'Aku mau memesan sesuatu',
            nextDialogId: 'npc3-menu',
          },
          {
            id: 'choice-wifi',
            text: 'Boleh minta WiFi nya yang mana sama passwordnya?',
            nextDialogId: 'npc3-wifi-info',
          },
        ],
      },
      {
        id: 'npc3-menu',
        speaker: 'Barista',
        text: 'Baik, silakan lihat menu di layar! Pilih minuman atau makanan yang kamu inginkan.',
        choices: [
          {
            id: 'choice-menu-close',
            text: 'Baik, terima kasih!',
            // No nextDialogId - will close and trigger menu popup
          },
        ],
      },
      {
        id: 'npc3-wifi-info',
        speaker: 'Barista',
        text: 'WiFi resmi kami bernama "CafeCorner" dan passwordnya harus memesan dulu ya.',
        autoAdvanceDelay: 3000,
        choices: [
          {
            id: 'choice-wifi-thanks',
            text: 'Baik, terima kasih!',
            // No nextDialogId means close
          },
        ],
      },
    ]

    setCurrentNPCDialogNodes(npc3Nodes)
    setCurrentNPCStartDialog('npc3-greeting')
    setShowNPCDialogSystem(true)
  }

  // Handle NPC interaction - NPC4 (Pasman - friend in cafe with laptop)
  const handleNPC4Interaction = () => {
    console.log('[CafeScenario] NPC4 interacted')
    
    const npc4Nodes: DialogNode[] = [
      {
        id: 'npc4-greeting',
        speaker: 'Pasman',
        text: 'Halo! Akhirnya kamu tiba! Aku sudah menunggu dengan laptop ini. Aku tidak tahu password WiFi kafe ini. Bisa bantu aku mencari tahu?',
        choices: [
          {
            id: 'choice-see-laptop',
            text: 'Baik! Biar aku lihat laptopmu.',
            // No nextDialogId means dialog closes immediately after selection
          },
        ],
      },
    ]

    setCurrentNPCDialogNodes(npc4Nodes)
    setCurrentNPCStartDialog('npc4-greeting')
    setShowNPCDialogSystem(true)
  }

  // Handle NPC dialog close
  const handleNPCDialogClose = (finalNodeId?: string) => {
    console.log('[CafeScenario] NPC dialog closed', { finalNodeId })
    setShowNPCDialogSystem(false)

    // Show cafe menu if "npc3-menu" dialog was closed (user clicked "Baik, terima kasih!")
    if (finalNodeId === 'npc3-menu') {
      setTimeout(() => {
        setShowCafeMenu(true)
      }, 300)
    }

    // Show laptop popup if NPC4 dialog just finished
    if (currentNPCStartDialog.includes('npc4')) {
      setNpc4DialogDone(true)
      setTimeout(() => {
        setShowLaptopPopup(true)
      }, 300)
    }

    // Log interaction based on which NPC was talked to
    if (currentNPCStartDialog.includes('bartender1')) {
      logGameAction('CHECK_OWNER')
    } else if (currentNPCStartDialog.includes('bartender2')) {
      logGameAction('CHECK_SECURITY')
    }
    // NPC3 and NPC4 dialogs just close without action logging
  }

  // Handle trigger box callback from game scene
  const handleTriggerBoxCallback = (trigger: TriggerBox) => {
    console.log('[CafeScenario] Trigger:', trigger)

    // Handle NPC proximity indicators - REMOVED (using click-to-interact instead)
  }

  // Handle interactive object callback
  const handleInteractiveCallback = (interactive: InteractiveObject) => {
    console.log('[CafeScenario] Interactive object:', interactive)

    // Langsung trigger dialog saat interactive object di-click (tidak perlu E indicator)
    const objectName = interactive.name
    
    if (objectName === 'talk_bartender1') {
      handleBartender1Interaction()
    } else if (objectName === 'talk_bartender2') {
      handleBartender2Interaction()
    } else if (objectName === 'npc3') {
      handleNPC3Interaction()
    } else if (objectName === 'npc4') {
      handleNPC4Interaction()
    }
  }

  // Reset scenario to initial state
  const resetScenario = async () => {
    console.log('[CafeScenario] Resetting scenario...')
    
    // Reset all UI states
    setLoading(true)
    setMissionResult(null)
    setSessionScoreEarned(0)  // ✅ Reset earned score
    // ✅ reset ending award values
    setEndingScoreAwarded(null)
    setEndingXpAwarded(null)
    setIsPaused(false)
    setShowQuitConfirm(false)
    setShowLaptopPopup(false)
    setNpc4DialogDone(false)
    setShowCafeMenu(false)
    setShowReceipt(false)
    setLastCartData([])
    setReceiptOnlyMode(false)
    setShowNPCDialogSystem(false)
    setCurrentNPCDialogNodes([])
    setCurrentNPCStartDialog('')
    
    // Reset mentor and intro states
    setMentorLineIdx(0)
    setShowMentor(true)
    setMentorHint(null)
    setIntroStep(0)
    setIntroDone(false)
    setBootText('')
    
    // Reset completion states
    setCompletionError(null)
    setCompletionSuccess(false)
    
    // Reset score and session
    setScore(0)
    setXp(0)
    setGameSessionId(null)
    setBaseUserScore(0)
    setUserCurrentXP(0)
    setUserXPToNextLevel(1000)
    setUserLevel(1)
    
    // Reinitialize game session
    try {
      const response = await fetch(`${API_URL}/api/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ scenarioId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to start game: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[CafeScenario] Game session reinitialized:', data)
      setGameSessionId(data.session.id)
      setScore(data.session.score || 0)
      setXp(Math.round((data.session.score || 0) / 10))
      
      // Fetch user stats again
      const userResponse = await fetch(`${API_URL}/api/user/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log('[CafeScenario] User stats (after reset):', userData)
        setBaseUserScore(userData.stats?.totalScore || 0)
        setUserCurrentXP(userData.stats?.currentXP || 0)
        setUserXPToNextLevel(userData.stats?.xpToNextLevel || 1000)
        setUserLevel(userData.stats?.level || 1)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('[CafeScenario] Reset error:', error)
      setLoading(false)
    }
  }

  // Show ending overlay whenever a mission result exists (existing UI already renders success/failed screens)
  const showEndingOverlay = missionResult !== null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-pixel text-xs text-foreground/70">INITIALIZATION CAFE SCENARIO...</p>
        </div>
      </div>
    )
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

      {/* INTRO SCREEN OVERLAY - Loading & Mission Briefing */}
      {!introDone && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${
            introStep === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            backgroundColor: introStep === 3 ? 'transparent' : 'rgba(10, 14, 39, 0.95)',
            backdropFilter: introStep === 3 ? 'none' : 'blur(2px)',
          }}
        >
          {/* Step 0: Boot Screen */}
          {introStep === 0 && (
            <Card className="bg-card/98 border-4 border-secondary/50 p-8 w-full max-w-md backdrop-blur-sm relative overflow-hidden">
              {/* Decorative top line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-secondary" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-secondary" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-secondary" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-secondary" />

              <div className="text-center space-y-4">
                <p className="text-sm text-foreground/80 font-pixel whitespace-pre-line">{bootText}</p>

                {/* Loading dots */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* Decorative bottom line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </Card>
          )}

          {/* Step 2: Scenario Briefing */}
          {introStep === 2 && (
            <div className="w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
              <Card className="bg-card/98 border-4 border-secondary/50 p-0 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

                {/* Decorative corners */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-secondary" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-secondary" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary" />

                {/* Title header */}
                <div className="bg-secondary/10 border-b-2 border-secondary/30 px-6 pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-secondary/20 border-2 border-secondary flex items-center justify-center overflow-hidden">
                      <Wifi className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-pixel text-[10px] text-secondary">MISSION 02 - WiFi SECURITY</p>
                      <Badge className="bg-accent/20 text-accent border border-accent/40 font-pixel text-[10px] mt-1">
                        SCENARIO BRIEFING
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Scenario description body */}
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <h3 className="font-pixel text-sm text-secondary mb-2">SCENARIO OVERVIEW</h3>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      Kamu sedang mengerjakan tugas sekolah di sebuah kafe yang terletak dekat dengan sekolahmu. Pemilik kafe menyediakan jaringan WiFi gratis untuk para pelanggan. Namun, ada beberapa jaringan WiFi yang tersedia di sini, dan tidak semuanya aman untuk digunakan.
                    </p>
                  </div>

                  <div className="border-l-2 border-secondary/40 pl-4">
                    <p className="font-pixel text-[10px] text-secondary mb-2">YOUR OBJECTIVES:</p>
                    <ul className="space-y-1 text-xs text-foreground/80">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Tanyakan kepada pemilik kafe jaringan WiFi mana yang aman dan resmi</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Identifikasi dan hindari "Evil Twin" WiFi yang mirip namanya dengan WiFi asli</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Terhubung hanya ke jaringan WiFi yang telah terverifikasi dan aman</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-accent/5 border border-accent/30 px-4 py-3 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-pixel text-[9px] text-accent mb-1">KEY LEARNING POINT</p>
                      <p className="text-xs text-foreground/80">Evil Twin WiFi adalah jaringan palsu yang dibuat oleh hacker untuk meniru jaringan asli. Mereka bisa menangkap data pribadi kamu seperti password dan informasi kartu kredit.</p>
                    </div>
                  </div>

                  <div className="bg-secondary/5 border border-secondary/30 px-4 py-3 flex gap-3">
                    <Lock className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-pixel text-[9px] text-secondary mb-1">SCORING SYSTEM</p>
                      <p className="text-xs text-foreground/80">Membuat pilihan yang tepat akan memberi kamu poin dan XP. Terhubung ke WiFi yang salah akan mengurangi poin kamu, namun ini adalah kesempatan untuk belajar!</p>
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="px-6 pb-6">
                  <Button
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-pixel text-xs h-12 animate-pulse-glow"
                    onClick={handleContinue}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    MASUK KE MISI
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Main Game Container */}
      <div className="relative z-10 w-full h-screen flex flex-col">
        {/* Top HUD Bar */}
        <div className="border-b-2 border-primary/30 bg-background/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Mission Title */}
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-secondary" />
              <span className="font-pixel text-xs text-foreground">{scenarioTitle}</span>
            </div>

            {/* Center: Score */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-pixel text-xs text-foreground">{baseUserScore + score}</span>
              </div>
            </div>

            {/* Right: XP Progress Bar */}
            <div className="flex items-center gap-3 w-40">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <Progress 
                  value={Math.min(((userCurrentXP + Math.round(score / 10)) / userXPToNextLevel) * 100, 100)} 
                  className="h-2" 
                />
              </div>
              <span className="font-pixel text-xs text-foreground">
                {userLevel}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 ml-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPaused(true)}
                className="relative"
              >
                <Pause className="w-5 h-5 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuitConfirm(true)}
              >
                <X className="w-5 h-5 text-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Game Canvas Area */}
          <div className="flex-1 flex flex-col p-4 gap-4">
            <Card className="flex-1 bg-card/50 border-4 border-primary/40 relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

              {/* Corner Decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-secondary z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-secondary z-10" />

              {/* Tiled Map Canvas - Properly centered */}
              <div className="w-full h-full flex items-center justify-center relative bg-background">
                <PhaserGameContainer
                  key={currentMapPath}
                  mapPath={currentMapPath}
                  width={1280}
                  height={960}
                  onTrigger={handleTriggerBoxCallback}
                  onInteract={handleInteractiveCallback}
                  debug={showDebug}
                  disabled={false}
                  onMapLoadComplete={() => {
                    console.log('[REACT CALLBACK] ✓ Map loading complete for:', currentMapPath)
                    setMapLoadingComplete(true)
                  }}
                />

                {/* NPC Interaction Indicator - Removed (using click-to-interact instead) */}
              </div>
              
              {/* Bottom control bar - inside the map Card */}
              {npc4DialogDone && !showLaptopPopup && (
                <div className="absolute bottom-2 right-4 z-20 flex items-center gap-2">
                  <button
                    onClick={() => setShowLaptopPopup(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border-2 border-primary/40 rounded hover:bg-primary/30 hover:border-primary/60 transition-all transform hover:scale-105 group"
                    title="Open Laptop"
                  >
                    <Monitor className="w-4 h-4 text-primary group-hover:text-primary/80" />
                    <span className="font-pixel text-xs text-primary group-hover:text-primary/80">LAPTOP</span>
                  </button>

                  {/* Open Receipt Button - muncul di samping LAPTOP button */}
                  {showReceipt && (
                    <button
                      onClick={() => {
                        setReceiptOnlyMode(true)
                        setShowCafeMenu(true)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border-2 border-amber-600/50 rounded hover:bg-amber-900/50 hover:border-amber-500/70 transition-all transform hover:scale-105 group"
                      title="Open Receipt"
                    >
                      <Printer className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                      <span className="font-pixel text-xs text-amber-300 group-hover:text-amber-200">RECEIPT</span>
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* NPC Dialog System */}
        {showNPCDialogSystem && (
          <NPCDialogSystem
            dialogNodes={currentNPCDialogNodes}
            startDialogId={currentNPCStartDialog}
            onClose={handleNPCDialogClose}
          />
        )}
      </div>

      {/* MENTOR DIALOG - Mentor advice and guidance */}
      <MentorDialog
        isVisible={introDone && showMentor}
        lines={mentorLines}
        currentLineIdx={mentorLineIdx}
        onContinue={() => setMentorLineIdx(prev => prev + 1)}
        onClose={() => {
          setShowMentor(false)
        }}
      />

      {/* Mission Success Overlay */}
      {missionResult === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
          
          <Card className="relative z-10 bg-card/95 backdrop-blur-sm border-4 border-primary p-10 w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            
            <div className="text-center space-y-6 relative">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-primary/20 border-4 border-primary rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-16 h-16 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="font-pixel text-3xl text-primary mb-3 animate-pulse">
                  MISI
                  <br />
                  BERHASIL
                </h2>
                <p className="text-foreground/70 text-sm">
                  Sempurna! Kamu berhasil menyelesaikan skenario keamanan WiFi dengan bijak.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4">
                {/* While finishing, don't show any numbers that may be stale */}
                {isFinishing || endingScoreAwarded === null || endingXpAwarded === null ? (
                  <div className="col-span-3 text-center text-foreground/70 text-sm">
                    Menghitung hasil...
                  </div>
                ) : (
                  <>
                    {/* Score: show only when backend actually awards score (replay => 0) */}
                    {endingScoreAwarded !== 0 && (
                      <div className="space-y-2">
                        <Star className="w-6 h-6 text-yellow-400 mx-auto" />
                        <p className="font-pixel text-2xl text-foreground">+{endingScoreAwarded}</p>
                        <p className="text-xs text-foreground/60">Poin Diperoleh</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Zap className="w-6 h-6 text-secondary mx-auto" />
                      <p className="font-pixel text-2xl text-secondary">+{endingXpAwarded}</p>
                      <p className="text-xs text-foreground/60">EXP Diperoleh</p>
                    </div>

                    {/* Badge: show only when score actually awarded */}
                    {endingScoreAwarded !== 0 && (
                      <div className="space-y-2">
                        <Award className="w-6 h-6 text-accent mx-auto" />
                        <p className="font-pixel text-2xl text-accent">+1</p>
                        <p className="text-xs text-foreground/60">Badge Terbuka</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Show badge card only when actually awarded (score awarded) */}
              {!isFinishing && endingScoreAwarded !== null && endingScoreAwarded !== 0 && (
                <Card className="bg-accent/10 border-2 border-accent p-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-accent flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-pixel text-xs text-accent mb-1">BADGE BARU TERBUKA!</p>
                      <p className="text-sm text-foreground">Ahli Keamanan WiFi</p>
                    </div>
                  </div>
                </Card>
              )}

              {completionError && (
                <Card className="bg-destructive/10 border-2 border-destructive p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-pixel text-xs text-destructive mb-1">ERROR</p>
                      <p className="text-sm text-foreground">{completionError}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-pixel text-sm h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (completionError) {
                      console.log('[CafeScenario] Cannot navigate to dashboard: ', completionError)
                      return
                    }
                    onNavigate?.('dashboard')
                  }}
                  disabled={!!completionError}
                >
                  {completionError ? 'RETRY LOGIN' : 'DASHBOARD'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mission Failed Overlay */}
      {missionResult === 'failed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
          
          <Card className="relative z-10 bg-card/95 backdrop-blur-sm border-4 border-destructive p-10 w-full max-w-lg animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent animate-pulse" />
          
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-destructive/20 border-4 border-destructive rounded-full flex items-center justify-center">
                <XCircle className="w-16 h-16 text-destructive" />
              </div>
            </div>

            <div>
              <h2 className="font-pixel text-3xl text-destructive mb-3">
                SIMULASI
                <br />
                GAGAL
              </h2>
              <p className="text-foreground/70 text-sm mb-4">
                Kamu terhubung ke jaringan WiFi yang tidak aman dan data kamu terancam dikompromikan.
              </p>
            </div>

            {/* Score Impact */}
            <div className="grid grid-cols-2 gap-4 py-2">
              {/* Penalty: only show if backend actually awards (first time) */}
              {(endingScoreAwarded ?? sessionScoreEarned) !== 0 && (
                <div className="space-y-2">
                  <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
                  <p className="font-pixel text-2xl text-destructive">{endingScoreAwarded ?? sessionScoreEarned}</p>
                  <p className="text-xs text-foreground/60">Penalty Diterima</p>
                </div>
              )}
              <div className="space-y-2">
                <Zap className="w-6 h-6 text-secondary mx-auto" />
                <p className="font-pixel text-2xl text-secondary">+{endingXpAwarded ?? Math.round(sessionScoreEarned / 10)}</p>
                <p className="text-xs text-foreground/60">EXP Diperoleh</p>
              </div>
            </div>

            <Card className="bg-accent/10 border-2 border-accent/50 p-4 text-left">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-pixel text-xs text-accent mb-2">TIPS KEAMANAN</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Selalu verifikasikan nama jaringan WiFi dengan staf sebelum terhubung. Hindari menghubungkan ke jaringan terbuka atau tidak terenkripsi di tempat publik.
                  </p>
                </div>
              </div>
            </Card>

            {completionError && (
              <Card className="bg-destructive/10 border-2 border-destructive p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-pixel text-xs text-destructive mb-1">ERROR</p>
                    <p className="text-sm text-foreground">{completionError}</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="w-full border-2 border-foreground/30 text-foreground hover:bg-foreground/10 font-pixel text-sm h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (completionError) {
                    console.log('[CafeScenario] Cannot navigate to dashboard: ', completionError)
                    return
                  }
                  onNavigate?.('dashboard')
                }}
                disabled={!!completionError}
              >
                {completionError ? 'RETRY LOGIN' : 'DASHBOARD'}
              </Button>
              <Button
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-pixel text-sm h-12 disabled:opacity-50"
                onClick={resetScenario}
                disabled={isFinishingGame}  // ✅ Disable while finishGame is in progress
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {isFinishingGame ? 'SAVING...' : 'RETRY'}
              </Button>
            </div>
          </div>
        </Card>
        </div>
      )}

      {/* Quit Confirmation Overlay */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
          <Card className="relative z-10 bg-card/95 border-4 border-destructive p-8 max-w-sm w-full mx-4">
            <h3 className="font-pixel text-2xl text-foreground mb-4">
              QUIT SCENARIO?
            </h3>
            <p className="text-foreground/70 text-sm mb-6">
              Your progress will be lost. Are you sure you want to quit?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-2 border-foreground/30 font-pixel text-sm h-10"
                onClick={() => setShowQuitConfirm(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-pixel text-sm h-10"
                onClick={() => {
                  setShowQuitConfirm(false)
                  onNavigate?.('dashboard')
                }}
              >
                QUIT
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Laptop Popup - untuk NPC4 dialog dan replay */}
      {/* Laptop Popup - always rendered to preserve state, but hidden when closed */}
      <div className={showLaptopPopup ? '' : 'hidden'}>
        <LaptopPopup
          sessionId={gameSessionId}  // ✅ Pass sessionId for feedback logging
          feedbackQuestions={feedbackQuestions}  // ✅ Pass fetched questions
          onClose={() => setShowLaptopPopup(false)}
          onMentorMessage={(msg) => setMentorHint(msg)}
          onMissionFail={() => {
            console.log('[CafeScenario] Mission failed - score earned:', score)
            setMissionSessionId(gameSessionId)
            setSessionScoreEarned(score)  // ✅ Capture score for ending UI
            setMissionResult('failed')
          }}
          onMissionSuccess={() => {
            console.log('[CafeScenario] Mission success - score earned:', score)
            setMissionSessionId(gameSessionId)
            setSessionScoreEarned(score)  // ✅ Capture score for ending UI
            setMissionResult('success')
          }}
          onScorePenalty={applyScorePenalty}
        />
      </div>

      {/* Cafe Menu Popup - untuk NPC3 order menu */}
      {showCafeMenu && (
        <CafeMenuPopup
          onClose={() => setShowCafeMenu(false)}
          onReceiptShown={(cartData) => {
            setShowReceipt(true)
            setReceiptOnlyMode(false)
            if (cartData) setLastCartData(cartData)
          }}
          receiptOnly={receiptOnlyMode}
          cartData={lastCartData}
        />
      )}
    </div>
  )
}

export default CafeScenarioPage
