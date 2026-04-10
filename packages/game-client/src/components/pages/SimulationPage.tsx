'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  XCircle,
  Mail,
  Zap,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { PhaserGameContainer } from '../PhaserGameContainer'
import { MentorDialog } from '../mentor-dialog'
import { PhonePopup } from '../phone-popup'
import { NPCDialogPopup } from '../npc-dialog-popup'
import { NPCDialogSystem, type DialogNode } from '../npc-dialog-system'
import { API_URL } from '../../lib/api'
import type { TriggerBox, InteractiveObject } from '../../game/types'

interface SimulationPageProps {
  onNavigate?: (page: string) => void
  onLogout?: () => void
  scenarioId?: string
  scenarioTitle?: string
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  onNavigate,
  onLogout,
  scenarioId = '1',
  scenarioTitle = 'Pengumuman Darurat dari Sekolah'
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [missionResult, setMissionResult] = useState<'success' | 'failed' | null>(null)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [baseUserScore, setBaseUserScore] = useState(0)
  const [userCurrentXP, setUserCurrentXP] = useState(0)
  const [userXPToNextLevel, setUserXPToNextLevel] = useState(1000)
  const [userLevel, setUserLevel] = useState(1)
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scenarioData, setScenarioData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)

  // NEW: Intro animation state (step 0 = boot, 1 = skipped, 2 = scenario, 3 = done)
  const [introStep, setIntroStep] = useState(0)
  const [introDone, setIntroDone] = useState(false)
  const [bootText, setBootText] = useState('')

  // NEW: Mentor dialog state
  const [mentorLineIdx, setMentorLineIdx] = useState(0)
  const [showMentor, setShowMentor] = useState(true)
  const [mentorHint, setMentorHint] = useState<string | null>(null)

  // NEW: Phone popup state
  const [showPhone, setShowPhone] = useState(false)
  const [phoneTriggeredOnce, setPhoneTriggeredOnce] = useState(false)

  // NEW: NPC dialog state
  const [showNPCDialog, setShowNPCDialog] = useState(false)
  const [npcDialogData, setNpcDialogData] = useState<{ name: string; message: string } | null>(null)

  // NEW: NPC dialog system state (for complex dialogs with choices)
  const [showNPCDialogSystem, setShowNPCDialogSystem] = useState(false)
  const [currentNPCDialogNodes, setCurrentNPCDialogNodes] = useState<DialogNode[]>([])
  const [currentNPCStartDialog, setCurrentNPCStartDialog] = useState('')
  const [barrierDisabled, setBarrierDisabled] = useState(false)

  // NEW: Track teacher dialog completion for good ending trigger
  const [teacherDialogCompleted, setTeacherDialogCompleted] = useState(false)

  // NEW: Track if finishGame is in progress (prevent race condition)
  const [isFinishingGame, setIsFinishingGame] = useState(false)

  // NEW: Track session score earned for ending UI display (separate from current score state)
  const [sessionScoreEarned, setSessionScoreEarned] = useState(0)

  // NEW: Next scene transition state
  const [showNextSceneHint, setShowNextSceneHint] = useState(false)
  const [nextSceneHintPos, setNextSceneHintPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [nextSceneTriggerActive, setNextSceneTriggerActive] = useState(false)  // ✅ Track if trigger is active

  // NEW: Map management state
  const [currentMapPath, setCurrentMapPath] = useState('/bedroom_map.tmj')
  const [mapLoadingComplete, setMapLoadingComplete] = useState(false)
  const [gameRetryCounter, setGameRetryCounter] = useState(0)
  
  // NEW: Classroom mentor state
  const [showClassroomMentor, setShowClassroomMentor] = useState(false)
  const [classroomMentorShown, setClassroomMentorShown] = useState(false)

  // NEW: Track if showing good ending mentor (teacher phishing confirmation)
  const [showGoodEndingMentor, setShowGoodEndingMentor] = useState(false)

  const [pendingMissionResult, setPendingMissionResult] = useState<'success' | 'failed' | null>(null)
  const [missionSessionId, setMissionSessionId] = useState<string | null>(null)  // ✅ Store sessionId with mission result!
  
  // NEW: Feedback questions state
  const [feedbackQuestions, setFeedbackQuestions] = useState<any>(null)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  
  // NEW: Handle score update from async action before triggering mission result
  useEffect(() => {
    if (pendingMissionResult) {
      console.log(`%c[MissionResult useEffect] pendingMissionResult detected: ${pendingMissionResult}`, 'color: #ffff00; background: #000; font-weight: bold; font-size: 12px')
      console.log(`[MissionResult useEffect] Current state:`, { score, sessionScoreEarned, gameSessionId })
      // NO DELAY - immediately set mission result so all state updates are batched
      console.log(`%c[MissionResult useEffect] Immediately calling setMissionResult('${pendingMissionResult}')`, 'color: #00ffff; font-weight: bold; font-size: 12px')
      setMissionResult(pendingMissionResult)
      setMissionSessionId(gameSessionId)  // ✅ Store sessionId 
      setPendingMissionResult(null)
      console.log('%c[MissionResult useEffect] setMissionResult called', 'color: #00ffff; font-weight: bold; font-size: 12px')
    }
  }, [pendingMissionResult, score, sessionScoreEarned, gameSessionId])

  // NEW: Create fresh game session when mission result is cleared (e.g., CONTINUE button)
  useEffect(() => {
    if (missionResult === null && gameSessionId && score !== 0 && !isFinishingGame && !pendingMissionResult) {  // ✅ Don't create new session if finishing game or mission pending
      // Player has cleared mission result (clicked CONTINUE or similar)
      // Create a new game session for the next play
      const createNewSession = async () => {
        const token = getToken()
        if (!token) return

        try {
          const startResponse = await fetch(`${API_URL}/api/game/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scenarioId })
          })

          if (startResponse.ok) {
            const sessionData = await startResponse.json()
            const newSessionId = sessionData.session?.id || sessionData.sessionId || sessionData.id
            if (newSessionId) {
              setGameSessionId(newSessionId)
              // Reset session score to 0, but keep baseUserScore updated
              setScore(0)
              setXp(0)
              setSessionScoreEarned(0)  // ✅ Reset earned score
              console.log('[SimulationPage] ✅ New game session created for continue:', newSessionId)
              console.log('[SimulationPage] Current user stats - score:', baseUserScore)
            }
          }
        } catch (error) {
          console.error('[SimulationPage] Error creating new session for continue:', error)
        }
      }

      createNewSession()
    }
  }, [missionResult, gameSessionId, score, scenarioId, baseUserScore, isFinishingGame, pendingMissionResult])

  // NEW: Track canvas position for E indicator positioning
  const [canvasPosition, setCanvasPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // NEW: Update canvas position when component mounts or layout changes
  useEffect(() => {
    // Pre-load trigger coordinates from TMJ file when map path changes
    const preloadTriggerCoordinates = async () => {
      try {
        const response = await fetch(currentMapPath)
        const mapData = await response.json()
        
        // Find next_scene_trigger in the Trigger object layer (for bedroom/phishing map)
        const triggerLayer = mapData.layers?.find((layer: any) => layer.name === 'Trigger')
        if (triggerLayer && triggerLayer.objects) {
          const nextSceneTrigger = triggerLayer.objects.find(
            (obj: any) => obj.name === 'next_scene_trigger'
          )
          if (nextSceneTrigger) {
            setNextSceneHintPos({ 
              x: nextSceneTrigger.x, 
              y: nextSceneTrigger.y 
            })
            console.log(`[Map Preload] Pre-loaded next_scene_trigger at (${nextSceneTrigger.x}, ${nextSceneTrigger.y})`)
          }
        }
        
        // For classroom map: Pre-load speak_friend and speak_teacher trigger coordinates
        // REMOVED: No longer needed since using click-to-interact instead of E indicator
      } catch (error) {
        console.error('[Map Preload] Failed to pre-load trigger coordinates:', error)
      }
    }

    preloadTriggerCoordinates()
  }, [currentMapPath])

  const bootString = 'Menginisialisasi Simulasi...'

  // Get token dynamically (in case it changes)
  const getToken = () => localStorage.getItem('authToken')

  // Helper function to calculate auto-advance delay based on character length
  // Formula: max(1500, length * 30)
  // ~30ms per character = ~20 words/sec reading speed
  const calculateAutoAdvanceDelay = (text: string): number => {
    return Math.max(1500, text.length * 30)
  }

  const mentorLines = [
    "Anda sekarang berada di dalam simulasi jaringan sekolah. Sebuah email baru saja tiba di kotak masuk Anda — terlihat resmi, tetapi ada yang terasa mencurigakan.",
    "Selidiki area dengan hati-hati. Klik pada ponsel untuk membaca email dan tentukan: apakah pesan ini sah atau upaya phishing?",
    "Tip: Gunakan tombol panah atau WASD untuk bergerak. Tekan E atau klik untuk berinteraksi dengan objek. Semoga berhasil!",
  ]

  // NEW: Good ending mentor message - shown after successfully confirming phishing with teacher
  const goodEndingMentorLines = [
    "Bagus! Kamu sudah konfirmasi hal itu ke gurumu.",
    "Yang pasti, kamu yakin itu beneran phishing. Kamu pandai mengidentifikasi nya.",
  ]

  const classroomMentorLines = [
    "Anda sekarang berada di SMA Lincoln. Koridor-koridor dipenuhi siswa yang bergerak antar kelas.",
    "Anda membutuhkan panduan tentang cara mengidentifikasi dan menangani email phishing. Coba berbicara dengan seseorang di sekitar sini — mungkin mereka bisa membantu mengarahkan Anda.",
  ]

  // NEW: Bintang dialog nodes (NPC dialog system)
  const playerName = 'Agen' // Could be fetched from user profile/token
  const bintangDialogNodes: DialogNode[] = [
    {
      id: 'bintang-greeting',
      speaker: 'Bintang',
      text: `Halo, ${playerName}!`,
      choices: [
        {
          id: 'choice-greeting',
          text: 'Halo, apa kabarmu?',
          nextDialogId: 'bintang-fine',
        },
        {
          id: 'choice-problem',
          text: 'Halo, aku perlu bantuan. Apakah ada guru yang bisa aku ajak bicara?',
          nextDialogId: 'bintang-teacher',
        },
      ],
    },
    {
      id: 'bintang-fine',
      speaker: 'Bintang',
      text: 'Aku baik-baik saja, terima kasih sudah bertanya!',
      autoAdvanceDelay: 1500,  // 47 chars * 30ms = 1410ms ≈ 1500ms
    },
    {
      id: 'bintang-teacher',
      speaker: 'Bintang',
      text: 'Guru seharusnya ada di ruang guru di sebelah sini. Ini waktu istirahat, jadi mereka seharusnya ada.',
      autoAdvanceDelay: 3000,  // 97 chars * 30ms = 2910ms ≈ 3000ms
    },
  ]

  // NEW: Teacher dialog nodes (NPC dialog system)
  const teacherDialogNodes: DialogNode[] = [
    {
      id: 'teacher-greeting',
      speaker: 'Guru',
      text: `Halo ${playerName}! Apa yang membawamu ke sini? Ada yang bisa aku bantu?`,
      choices: [
        {
          id: 'choice-email-check',
          text: 'Guru, apa kabarmu? Aku punya pertanyaan tentang pemeliharaan akun.',
          nextDialogId: 'teacher-email-response',
        },
        {
          id: 'choice-phishing-general',
          text: 'Guru, aku menerima email yang meminta saya memperbarui data akun untuk keperluan sekolah. Itu terasa mencurigakan.',
          nextDialogId: 'teacher-phishing-response',
        },
      ],
    },
    {
      id: 'teacher-email-response',
      speaker: 'Guru',
      text: 'Aku baik-baik saja, terima kasih sudah bertanya! Ada yang spesifik tentang pemeliharaan akun yang ingin kita diskusikan?',
      autoAdvanceDelay: 3500,  // 120 chars * 30ms = 3600ms ≈ 3500ms
    },
    {
      id: 'teacher-phishing-response',
      speaker: 'Guru',
      text: 'Observasi yang sangat bagus! Kamu benar-benar bijaksana untuk berhati-hati. Sekolah kami tidak pernah meminta pembaruan data akun melalui email. Jika kamu menerima pesan seperti itu, kemungkinan besar itu adalah upaya phishing. Selalu verifikasi langsung dengan departemen IT atau administrasi sebelum membagikan informasi pribadi apa pun. Kamu melakukan hal yang benar dengan mengkonfirmasikan dengan saya terlebih dahulu!',
      autoAdvanceDelay: 13500,  // 451 chars * 30ms = 13530ms ≈ 13500ms (very long response, give reader more time)
    },
  ]

  // Utility function to log game action to backend
  const logGameAction = async (actionType: string) => {
    console.log('%c[🎮 LOG ACTION] 🚀🚀🚀 CALLED 🚀🚀🚀', 'color: #ffff00; background: #000; font-weight: bold; font-size: 14px')
    const token = getToken()
    if (!gameSessionId || !token) {
      console.warn(`%c[🎮 LOG ACTION] Cannot log action: sessionId=${gameSessionId}, token=${!!token}`, 'color: #ff0000; font-weight: bold; font-size: 12px')
      return undefined  // ✅ Explicit return
    }

    try {
      console.log(`%c[🎮 LOG ACTION] 🚀 Logging action: ${actionType}`, 'color: #00ffff; font-weight: bold; font-size: 12px')
      console.log(`  - sessionId: ${gameSessionId}`)
      console.log(`  - token prefix: ${token.substring(0, 20)}...`)
      
      const body = {
        sessionId: gameSessionId,
        actionType,
        value: null
      }
      console.log(`[🎮 LOG ACTION] Request body:`, body)
      
      const response = await fetch(`${API_URL}/api/game/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      console.log(`[🎮 LOG ACTION] Response received: status=${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`%c[🎮 LOG ACTION] ✅ Response parsed:`, 'color: #00ff00; font-weight: bold; font-size: 12px', {
          success: data.success,
          actionType: data.actionType,
          scoreEarned: data.scoreEarned,
          sessionScore: data.sessionScore,
          message: data.message
        })
        console.log(`%c[🎮 LOG ACTION] ✅ RETURNING data with sessionScore: ${data.sessionScore}`, 'color: #00ff00; font-weight: bold; font-size: 14px')
        return data  // ✅ Explicit return with data
      } else {
        const errorText = await response.text()
        console.error(`%c[🎮 LOG ACTION] ❌ Response NOT OK: ${response.status} ${response.statusText}`, 'color: #ff0000; font-weight: bold; font-size: 12px')
        console.error(`[🎮 LOG ACTION] ❌ Response body:`, errorText)
        console.log(`%c[🎮 LOG ACTION] ❌ RETURNING undefined (error)`, 'color: #ff0000; font-weight: bold; font-size: 12px')
        return undefined  // ✅ Explicit return
      }
    } catch (error) {
      console.error('%c[🎮 LOG ACTION] ❌ CATCH ERROR:', 'color: #ff0000; font-weight: bold; font-size: 12px', error)
      console.log(`%c[🎮 LOG ACTION] ❌ RETURNING undefined (catch)`, 'color: #ff0000; font-weight: bold; font-size: 12px')
      return undefined  // ✅ Explicit return
    }
  }

  // Utility function to complete scenario with backend
  const completeScenarioWithBackend = async () => {
    const token = getToken()
    if (!token || !missionSessionId) {  // ✅ Use missionSessionId, not gameSessionId!
      console.warn('[SimulationPage] Cannot complete scenario: missing token or missionSessionId')
      return
    }

    console.log('[SimulationPage] Sending scenario completion for session:', missionSessionId);  // ✅ Log correct sessionId!

    try {
      const response = await fetch(`${API_URL}/api/game/finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: missionSessionId  // ✅ Use stored sessionId!
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[SimulationPage] ✓ Backend responded with:', data)
        return data
      } else {
        console.error(`[SimulationPage] Failed to complete scenario: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[SimulationPage] Error completing scenario:', error)
    }
  }

  // Fetch scenario data on mount
  useEffect(() => {
    const fetchScenarioData = async () => {
      const token = getToken()
      if (!token || !scenarioId) {
        setLoading(false)
        return
      }

      try {
        // Start game session on mount
        try {
          const startResponse = await fetch(`${API_URL}/api/game/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scenarioId })
          })

          if (startResponse.ok) {
            const sessionData = await startResponse.json()
            console.log('[Backend] Session response:', sessionData)
            // Handle different response structures
            const sessionId = sessionData.session?.id || sessionData.sessionId || sessionData.id
            if (sessionId) {
              setGameSessionId(sessionId)
              console.log('[Backend] Game session started:', sessionId)
              // Initialize score from session (should be 0 at start)
              const initialScore = sessionData.session?.score || 0
              setScore(initialScore)
              setXp(Math.round(initialScore / 10))
              console.log('[Backend] Initial session score:', initialScore)
            } else {
              console.error('[Backend] No session ID in response:', sessionData)
            }
          } else {
            console.error('[Backend] Failed to start session:', startResponse.statusText)
          }
        } catch (error) {
          console.error('[Backend] Error starting game session:', error)
        }

        // Try both proxy path and API_URL
        const apiPaths = [
          `/api/game/${scenarioId}`,
          `${API_URL}/api/game/${scenarioId}`
        ]

        let response = null
        for (const path of apiPaths) {
          try {
            response = await fetch(path, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            if (response.ok) {
              console.log(`✓ Fetched scenario from: ${path}`)
              break
            }
          } catch (e) {
            console.log(`Failed to fetch from ${path}`)
          }
        }

        if (response?.ok) {
          const data = await response.json()
          setScenarioData(data.scenario || data)
          console.log('Scenario data loaded:', data.scenario?.title || data.title)
        } else {
          console.warn('Could not fetch scenario data, game will continue without API data')
          // Game will continue without scenario data
        }

        // Fetch user stats to get their current base score
        try {
          const userResponse = await fetch(`${API_URL}/api/user/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (userResponse.ok) {
            const userData = await userResponse.json()
            console.log('[SimulationPage] User stats:', userData)
            setUserStats(userData)
            // Store base score and XP info so we can display total = base + session score
            setBaseUserScore(userData.stats?.totalScore || 0)
            setUserCurrentXP(userData.stats?.currentXP || 0)
            setUserXPToNextLevel(userData.stats?.xpToNextLevel || 1000)
            setUserLevel(userData.stats?.level || 1)
          }
        } catch (error) {
          console.error('[SimulationPage] Error fetching user stats:', error)
        }

        // ✅ NEW: Fetch feedback questions from backend
        try {
          setQuestionsLoading(true)
          const questionsResponse = await fetch(`${API_URL}/api/game/questions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json()
            console.log('[SimulationPage] Feedback questions loaded:', Object.keys(questionsData.questions))
            setFeedbackQuestions(questionsData.questions)
          } else {
            console.warn('[SimulationPage] Failed to fetch feedback questions:', questionsResponse.statusText)
          }
        } catch (error) {
          console.error('[SimulationPage] Error fetching feedback questions:', error)
        } finally {
          setQuestionsLoading(false)
        }

      } finally {
        setLoading(false)
      }
    }

    fetchScenarioData()
  }, [scenarioId])

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

  // NEW: Log map path changes
  useEffect(() => {
    console.log('[REACT STATE] currentMapPath changed to:', currentMapPath)
  }, [currentMapPath])

  // NEW: Show classroom mentor when map loading is complete
  useEffect(() => {
    if (mapLoadingComplete && currentMapPath.includes('classroom_map') && !classroomMentorShown && !showGoodEndingMentor) {
      console.log('[REACT] Map loading complete, showing classroom mentor...')
      setClassroomMentorShown(true)
      setShowClassroomMentor(true)
      setShowMentor(true) // Ensure mentor dialog is visible
      setMentorLineIdx(0)
      setMentorHint(null)
    }
  }, [mapLoadingComplete, currentMapPath, classroomMentorShown, showGoodEndingMentor])  // 🔧 Add showGoodEndingMentor to dependencies

  // NEW: Continue button handler
  const handleContinue = () => {
    setIntroStep(3)
    setTimeout(() => setIntroDone(true), 600)
  }

  // NEW: Phone mentor hint handler
  const handlePhoneMentorHint = (msg: string) => {
    setMentorHint(msg)
    // Do NOT set mentorTyped or mentorDone here - let the useEffect handle typewriter
    setShowMentor(true)
    // Do NOT show hint here - only show when phishing form is cancelled
  }

  // NEW: Handler for phishing form cancellation - shows the hint (!)
  const handlePhishingFormCancel = () => {
    // Activate next_scene_trigger to act as a normal trigger (not a barrier anymore)
    console.log('[handlePhishingFormCancel] Activating next_scene_trigger...')
    setNextSceneTriggerActive(true)
    
    // Show next scene hint only after player cancels the phishing form
    setTimeout(() => setShowNextSceneHint(true), 1000)
  }

  const handleQuit = async () => {
    setShowQuitConfirm(false)
    
    // Optional: Save progress before quitting (if a session exists)
    if (gameSessionId) {
      try {
        const token = getToken()
        await fetch(`${API_URL}/api/game/finish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: gameSessionId
          })
        })
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    }

    onNavigate?.('dashboard')
  }

  const handleRetry = async () => {
    // First, reset all UI state
    setMissionResult(null)
    setScore(0)
    setXp(0)
    setSessionScoreEarned(0)  // ✅ Reset earned score
    setUserStats(null)

    // Reset intro state
    setIntroStep(0)
    setIntroDone(false)
    setBootText('')

    // Reset mentor state
    setMentorLineIdx(0)
    setShowMentor(true)
    setMentorHint(null)

    // Reset phone state
    setShowPhone(false)
    setPhoneTriggeredOnce(false)

    // Reset NPC dialog state
    setShowNPCDialog(false)
    setNpcDialogData(null)
    setShowNPCDialogSystem(false)
    setCurrentNPCDialogNodes([])
    setCurrentNPCStartDialog('')
    setBarrierDisabled(false)

    // Reset map state - CRITICAL!
    setCurrentMapPath('/bedroom_map.tmj')
    setMapLoadingComplete(false)

    // Reset transition state
    setShowNextSceneHint(false)
    setIsTransitioning(false)

    // Reset classroom mentor state
    setShowClassroomMentor(false)
    setClassroomMentorShown(false)
    setShowGoodEndingMentor(false)  // 🔧 Reset good ending mentor flag
    setTeacherDialogCompleted(false)  // 🔧 Reset teacher dialog flag

    // Create a NEW game session on the backend
    const token = getToken()
    if (token) {
      try {
        const startResponse = await fetch(`${API_URL}/api/game/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ scenarioId })
        })

        if (startResponse.ok) {
          const sessionData = await startResponse.json()
          const newSessionId = sessionData.session?.id || sessionData.sessionId || sessionData.id
          if (newSessionId) {
            setGameSessionId(newSessionId)
            console.log('[SimulationPage] ✅ New game session created for retry:', newSessionId)
          }
        } else {
          console.error('[SimulationPage] Failed to create new session for retry:', startResponse.statusText)
        }
      } catch (error) {
        console.error('[SimulationPage] Error creating new session for retry:', error)
      }
    }

    // Increment retry counter to force Phaser game remount
    // This ensures the game engine is completely reset
    setGameRetryCounter(prev => prev + 1)

    console.log('[SimulationPage] ✅ Full reset complete - ready for retry (counter:', gameRetryCounter + 1, ')')
  }

  const handleTrigger = useCallback((trigger: TriggerBox) => {
    console.log('Trigger activated:', trigger.name, trigger.action)
    
    // Track proximity to NPCs for interaction indicator (E prompt)
    // Handle NPC interaction triggers for continuous proximity
    if (trigger.name === 'speak_friend') {
      // Click-to-interact on classroom map - dialog triggered via handleInteract()
      // No E indicator needed
    } else if (trigger.name === 'speak_teacher') {
      // Click-to-interact on classroom map - dialog triggered via handleInteract()
      // No E indicator needed
    } else if (trigger.name === 'speak_friend_exit' || trigger.name === 'speak_teacher_exit') {
      // No E indicator exit handling needed anymore
    }
    
    // Handle trigger actions
    if (trigger.action === 'open_phone') {
      // Open phone only once from trigger area
      if (!phoneTriggeredOnce) {
        console.log('Opening phone from trigger...')
        setShowPhone(true)
        setPhoneTriggeredOnce(true)
      }
    }
    
    // Handle next scene trigger
    if (trigger.name === 'next_scene_trigger') {
      console.log('[REACT] Next scene trigger activated from Phaser!')
      console.log('[REACT] Current state - isTransitioning:', isTransitioning, 'showNextSceneHint:', showNextSceneHint)
      
      // Store trigger position for indicator
      setNextSceneHintPos({ x: trigger.x, y: trigger.y })
      
      // Transition to classroom map when player enters trigger (only if not already transitioning)
      if (!isTransitioning) {
        console.log('[REACT] Starting transition to classroom map...')
        setIsTransitioning(true)
        
        // Load new map immediately - loading screen appears right away
        console.log('[REACT] Loading classroom map immediately...')
        setMapLoadingComplete(false)
        console.log('[REACT] Setting currentMapPath to /classroom_map.tmj')
        setCurrentMapPath('/classroom_map.tmj')
        setShowNextSceneHint(false)
        // isTransitioning stays true until map finishes loading
      } else {
        console.log('[REACT] Already transitioning, ignoring duplicate trigger')
      }
    }
  }, [isTransitioning, showNextSceneHint, phoneTriggeredOnce])

  const handleTeacherDialogComplete = async () => {
    console.log('%c[🎓 TEACHER DIALOG] ✅ handleTeacherDialogComplete CALLED!', 'color: #00ff00; font-weight: bold; font-size: 14px')
    console.log('%c[🎓 TEACHER DIALOG] Current gameSessionId: ' + gameSessionId, 'color: #00ff00; font-size: 12px')
    console.log('%c[🎓 TEACHER DIALOG] Current score state BEFORE action: ' + score, 'color: #00ff00; font-size: 12px')
    console.log('%c[🎓 TEACHER DIALOG] Teacher dialog finished - getting score from backend before triggering good ending', 'color: #00ff00; font-size: 12px')
    
    // Log teacher confirmation action to backend and get updated score
    try {
      console.log('%c[🎓 TEACHER DIALOG] About to call logGameAction with sessionId: ' + gameSessionId, 'color: #00ff00; font-size: 12px')
      const result = await logGameAction('teacher_phishing_confirmed')
      console.log('%c[🎓 TEACHER DIALOG] logGameAction RETURNED with result:', 'color: #00ffff; font-weight: bold; font-size: 12px', result)
      console.log('%c[🎓 TEACHER DIALOG] result type: ' + typeof result + ' result keys: ' + (result ? Object.keys(result).join(',') : 'null'), 'color: #00ffff; font-size: 12px')
      
      if (result && result.sessionScore !== undefined) {
        const updatedScore = result.sessionScore
        console.log('%c[🎓 TEACHER DIALOG] ✅✅✅ Session score from backend: ' + updatedScore + ' (earned +' + result.scoreEarned + ' points)', 'color: #00ff00; background: #000; font-weight: bold; font-size: 14px')
        // Update local state with backend score - ALL IN ONE BATCH!
        setScore(updatedScore)
        setSessionScoreEarned(updatedScore)  // ✅ Store for ending UI
        setMissionSessionId(gameSessionId)  // ✅ Store sessionId
        setMentorLineIdx(0)
        setShowGoodEndingMentor(true)  // 🔧 Show good ending mentor
        setShowMentor(true)
        console.log('%c[🎓 TEACHER DIALOG] ✅ All state updates batched and queued', 'color: #00ff00; font-weight: bold; font-size: 12px')
        // NO DELAY - immediately trigger mission result so React batches all state updates together
        console.log('%c[🎓 TEACHER DIALOG] ✅ Calling setPendingMissionResult(success) immediately', 'color: #00ff00; font-weight: bold; font-size: 12px')
        setPendingMissionResult('success')
      } else {
        console.warn('%c[🎓 TEACHER DIALOG] ⚠️⚠️⚠️ No sessionScore in response!', 'color: #ff9900; background: #000; font-weight: bold; font-size: 14px', result)
        console.warn('%c[🎓 TEACHER DIALOG] ⚠️ Using score from state: ' + score, 'color: #ff9900; font-size: 12px')
        setScore(0)  // Reset to 0 for clarity
        setSessionScoreEarned(0)
        setMissionSessionId(gameSessionId)
        setMentorLineIdx(0)
        setShowGoodEndingMentor(true)
        setShowMentor(true)
        setPendingMissionResult('success')
      }
    } catch (err) {
      console.error('%c[🎓 TEACHER DIALOG] ❌❌❌ Error logging teacher confirmation:', 'color: #ff0000; background: #000; font-weight: bold; font-size: 14px', err)
      // Still trigger good ending even if logging failed
      setMissionSessionId(gameSessionId)
      setMentorLineIdx(0)
      setShowGoodEndingMentor(true)
      setShowMentor(true)
      setPendingMissionResult('success')
    }
    
    console.log('%c[🎓 TEACHER DIALOG] handleTeacherDialogComplete COMPLETED!', 'color: #00ff00; font-weight: bold; font-size: 12px')
  }

  const handleInteract = (interactive: InteractiveObject) => {
    console.log('Interactive object:', interactive.name, interactive.event)
    // Handle interactive actions
    if (interactive.name === 'phone' || interactive.event === 'phone_menu') {
      console.log('Opening phone from interactive object...')
      setShowPhone(true)
    }

    // Handle Bintang (speak_friend) dialog with choices - use NPC Dialog System
    if (interactive.name === 'speak_friend') {
      console.log('Opening Bintang dialog system...')
      setCurrentNPCDialogNodes(bintangDialogNodes)
      setCurrentNPCStartDialog('bintang-greeting')
      setShowNPCDialogSystem(true)
    }
    
    // Handle Teacher (speak_teacher) dialog with choices - use NPC Dialog System
    if (interactive.name === 'speak_teacher') {
      console.log('Opening Teacher dialog system...')
      setCurrentNPCDialogNodes(teacherDialogNodes)
      setCurrentNPCStartDialog('teacher-greeting')
      setShowNPCDialogSystem(true)
    }
  }

  // Handle mission completion - send score to backend and refresh user stats
  useEffect(() => {
    if (missionResult === 'success' || missionResult === 'failed') {
      // ✅ CRITICAL: Set isFinishingGame IMMEDIATELY to block new session creation
      setIsFinishingGame(true)
      
      // After a short delay to let animations finish, complete scenario on backend
      const timer = setTimeout(async () => {
        const isSuccess = missionResult === 'success'
        console.log(`[Frontend] Completing scenario:`, { isSuccess, score, missionSessionId })
        const result = await completeScenarioWithBackend()
        
        // Store updated user stats from backend response
        if (result?.data?.userStats) {
          setUserStats(result.data.userStats)
          setBaseUserScore(result.data.userStats.totalScore)
          setUserCurrentXP(result.data.userStats.currentXP)
          setUserLevel(result.data.userStats.level)
          setUserXPToNextLevel(result.data.userStats.xpToNextLevel)
          console.log(`[Frontend] ✓ Updated user stats from backend:`, result.data.userStats)
        } else {
          // If no stats in response, manually fetch them
          console.log(`[Frontend] No userStats in finishGame response, fetching separately...`)
          const token = getToken()
          if (token) {
            try {
              const statsResponse = await fetch(`${API_URL}/api/user/stats`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (statsResponse.ok) {
                const statsData = await statsResponse.json()
                console.log(`[Frontend] Fetched fresh user stats:`, statsData.stats)
                setBaseUserScore(statsData.stats?.totalScore || 0)
                setUserCurrentXP(statsData.stats?.currentXP || 0)
                setUserLevel(statsData.stats?.level || 1)
                setUserXPToNextLevel(statsData.stats?.xpToNextLevel || 1000)
              }
            } catch (error) {
              console.error('[Frontend] Error fetching user stats:', error)
            }
          }
        }
        setIsFinishingGame(false)  // ✅ Mark as done
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [missionResult, missionSessionId])

  const handleComplete = async () => {
    try {
      const token = getToken()
      if (!gameSessionId) {
        console.warn('[SimulationPage] Cannot complete: No session ID')
        return
      }

      await fetch(`${API_URL}/api/game/finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: gameSessionId
        })
      })

      onNavigate?.('dashboard')
    } catch (error) {
      console.error('Error completing scenario:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-pixel text-xs text-foreground/70">LOADING SCENARIO...</p>
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

      {/* Main Game Container */}
      <div className="relative z-10 w-full h-screen flex flex-col">
        {/* Top HUD Bar */}
        <div className="border-b-2 border-primary/30 bg-background/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Mission Title */}
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-secondary" />
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
                <Progress value={Math.min((userCurrentXP / userXPToNextLevel) * 100, 100)} className="h-2" />
              </div>
              <span className="font-pixel text-xs text-foreground">{Math.round((userCurrentXP / userXPToNextLevel) * 100)}%</span>
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
            <Card className="flex-1 bg-card/50 border-4 border-primary/40 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

              {/* Corner Decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary z-10" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-secondary z-10" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-secondary z-10" />

              {/* Tiled Map Canvas */}
              <div className="w-full h-full flex items-center justify-center relative bg-background">
                {/* NEW: NPC Dialog Popup */}
                {showNPCDialog && npcDialogData && (
                  <NPCDialogPopup
                    data={npcDialogData}
                    onClose={() => {
                      setShowNPCDialog(false)
                      setNpcDialogData(null)
                    }}
                  />
                )}

                {/* NEW: NPC Dialog System (with choices) */}
                {showNPCDialogSystem && currentNPCDialogNodes.length > 0 && (
                  <NPCDialogSystem
                    dialogNodes={currentNPCDialogNodes}
                    startDialogId={currentNPCStartDialog}
                    playerName={playerName}
                    onDialogChange={(dialogId) => {
                      // Disable barrier when player reaches 'bintang-teacher' dialog
                      if (dialogId === 'bintang-teacher') {
                        setBarrierDisabled(true)
                      }
                      // Track when teacher phishing response is shown (final dialog for teacher)
                      if (dialogId === 'teacher-phishing-response') {
                        console.log('[Dialog Complete] Teacher phishing response reached - will trigger good ending')
                        setTeacherDialogCompleted(true)
                      }
                    }}
                    onClose={(currentDialogId) => {
                      console.log('[🎓 TEACHER NPC] onClose called with dialogId:', currentDialogId)
                      setShowNPCDialogSystem(false)
                      setCurrentNPCDialogNodes([])
                      setCurrentNPCStartDialog('')
                      
                      // If teacher phishing dialog is the one that just closed, trigger good ending + mentor message + scoring
                      if (currentDialogId === 'teacher-phishing-response') {
                        console.log('[🎓 TEACHER NPC] ✅ teacher-phishing-response closed - CALLING handleTeacherDialogComplete!')
                        handleTeacherDialogComplete().catch(err => {
                          console.error('[🎓 TEACHER NPC] ❌ Error in handleTeacherDialogComplete:', err)
                        })
                      } else {
                        console.log('[🎓 TEACHER NPC] Dialog closed but not teacher-phishing-response:', currentDialogId)
                      }
                    }}
                  />
                )}

                {/* NEW: Phone Popup — scoped inside game canvas */}
                {showPhone && (
                  <PhonePopup
                    sessionId={gameSessionId}  // ✅ Pass sessionId for feedback logging
                    feedbackQuestions={feedbackQuestions}  // ✅ Pass fetched questions
                    onClose={() => {
                      setShowPhone(false)
                      // Don't show hint here - only when phishing form is cancelled
                    }}
                    onMissionSuccess={async (actionType) => {
                      console.log('[PhonePopup] Mission success - action:', actionType)
                      
                      // ✅ CRITICAL: Store sessionId for finishGame later
                      setMissionSessionId(gameSessionId)
                      
                      // Log the success action to backend and get updated score
                      try {
                        const result = await logGameAction(actionType)
                        if (result?.sessionScore !== undefined) {
                          setScore(result.sessionScore)
                          setSessionScoreEarned(result.sessionScore)  // ✅ Store for ending UI
                          console.log(`[Frontend] Session score updated to: ${result.sessionScore} (+${result.scoreEarned} points)`)
                        }
                      } catch (err) {
                        console.error('[Frontend] Error logging action:', err)
                      }
                      
                      // Close phone and set pending mission result
                      setShowPhone(false)
                      setPendingMissionResult('success')
                    }}
                    onMentorMessage={handlePhoneMentorHint}
                    onMissionFail={async (actionType) => {
                      console.log('[PhonePopup] Mission failed - action:', actionType)
                      
                      // ✅ CRITICAL: Store sessionId for finishGame later
                      setMissionSessionId(gameSessionId)
                      
                      // Log the fail action to backend and get updated score (usually negative)
                      try {
                        const result = await logGameAction(actionType)
                        if (result?.sessionScore !== undefined) {
                          setScore(result.sessionScore)
                          setSessionScoreEarned(result.sessionScore)  // ✅ Store for ending UI
                          console.log(`[Frontend] Session score updated to: ${result.sessionScore} (${result.scoreEarned > 0 ? '+' : ''}${result.scoreEarned} points)`)
                        }
                      } catch (err) {
                        console.error('[Frontend] Error logging action:', err)
                      }
                      
                      // Close phone and set pending mission result
                      setShowPhone(false)
                      setPendingMissionResult('failed')
                    }}
                    onPhishingFormCancel={handlePhishingFormCancel}
                  />
                )}

                <PhaserGameContainer
                  key={`${currentMapPath}-retry-${gameRetryCounter}`}
                  mapPath={currentMapPath}
                  width={1280}
                  height={960}
                  onTrigger={handleTrigger}
                  onInteract={handleInteract}
                  debug={showDebug}
                  disabled={false}
                  disableBarrier={nextSceneTriggerActive}  // ✅ Disable barrier when player klik "Back" pada phishing form
                  onMapLoadComplete={() => {
                    console.log('[REACT CALLBACK] ✓ Map loading complete for:', currentMapPath)
                    setMapLoadingComplete(true)
                    setIsTransitioning(false)
                  }}
                />

                {/* Next Scene Hint - Exclamation mark indicator */}
                {showNextSceneHint && !isTransitioning && (
                  <div
                    className="absolute z-30 pointer-events-none animate-bounce"
                    style={{
                      left: `${nextSceneHintPos.x + 480}px`,
                      top: `${nextSceneHintPos.y - 24}px`,
                    }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full scale-150" />
                      <div className="relative w-12 h-12 bg-accent border-2 border-accent/80 flex items-center justify-center rounded-lg shadow-lg">
                        <span className="font-pixel text-lg font-bold text-accent-foreground">!</span>
                      </div>
                      <div className="absolute inset-0 border-2 border-accent rounded-lg animate-pulse" />
                    </div>
                  </div>
                )}

                {/* NPC Interaction Indicator - Removed (using click-to-interact instead) */}
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
            </Card>

            {/* Dialog Box - Bottom - REMOVED: Using mentor popup system instead */}
          </div>


        </div>
      </div>

      {/* NEW: Mentor Dialog - Now in separate optimized component */}
      <MentorDialog
        isVisible={introDone && showMentor}
        lines={showGoodEndingMentor ? goodEndingMentorLines : mentorLines}
        classroomLines={classroomMentorLines}
        currentLineIdx={mentorLineIdx}
        isClassroom={showClassroomMentor && !showGoodEndingMentor}  // 🔧 Don't show classroom lines if showing good ending
        hint={mentorHint}
        onContinue={() => setMentorLineIdx(prev => prev + 1)}
        onClose={() => {
          setShowMentor(false)
          setMentorHint(null)
          if (showGoodEndingMentor) {
            setShowGoodEndingMentor(false)  // 🔧 Reset good ending mentor flag when closed
            setShowClassroomMentor(false)  // Clear classroom mentor too
          }
        }}
      />

      {/* NEW: Screen transition overlay with loading */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black"
          style={{
            opacity: 1,
          }}
        >
          <Card className="bg-card/98 border-4 border-primary/50 p-8 w-full max-w-md backdrop-blur-sm relative overflow-hidden">
            {/* Decorative top line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-secondary" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-secondary" />

            <div className="text-center space-y-4">
              <p className="text-sm text-foreground/80 font-pixel">Initializing Classroom...</p>

              {/* Loading dots */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>

            {/* Decorative bottom line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
          </Card>
        </div>
      )}

      {/* Intro Animation Overlay */}
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
            <Card className="bg-card/98 border-4 border-primary/50 p-8 w-full max-w-md backdrop-blur-sm relative overflow-hidden">
              {/* Decorative top line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary" />

              <div className="text-center space-y-4">
                <p className="text-sm text-foreground/80 font-pixel">{bootText}</p>

                {/* Loading dots */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* Decorative bottom line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
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
                      <Target className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-pixel text-[10px] text-secondary">MISI 01 - DETEKSI PHISHING</p>
                      <Badge className="bg-accent/20 text-accent border border-accent/40 font-pixel text-[10px] mt-1">
                        PENJELASAN SKENARIO
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Scenario description body */}
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <h3 className="font-pixel text-sm text-primary mb-2">RINGKASAN SKENARIO</h3>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      Kamu adalah seorang siswa di SMA Lincoln. Kamu baru saja masuk ke akun email sekolahmu dan menemukan pesan mencurigakan di kotak masuk. Email tersebut mengaku dari departemen IT sekolah dan berisi pesan mendesak tentang keamanan jaringan.
                    </p>
                  </div>

                  <div className="border-l-2 border-secondary/40 pl-4">
                    <p className="font-pixel text-[10px] text-secondary mb-2">TUJUAN MISIMU:</p>
                    <ul className="space-y-1 text-xs text-foreground/80">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Selidiki email dengan hati-hati dan identifikasi tanda-tanda mencurigakan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Tentukan apakah kamu harus mempercayai pesan ini atau melaporkannya sebagai phishing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Ambil tindakan yang tepat untuk melindungi akun kamu</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-accent/5 border border-accent/30 px-4 py-3 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-pixel text-[9px] text-accent mb-1">POIN PEMBELAJARAN KUNCI</p>
                      <p className="text-xs text-foreground/80">Serangan phishing sering menggunakan urgensi dan email yang terlihat resmi untuk menipu kamu. Selalu verifikasi pengirim dan periksa tautan mencurigakan sebelum mengklik.</p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/30 px-4 py-3 flex gap-3">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-pixel text-[9px] text-primary mb-1">SISTEM PENILAIAN</p>
                      <p className="text-xs text-foreground/80">Membuat keputusan yang tepat akan memberikan kamu poin dan XP. Pilihan yang salah akan mengurangi poin, tapi jangan khawatir—kamu akan belajar darinya!</p>
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="px-6 pb-6">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-xs h-12 animate-pulse-glow"
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

      {/* Pause Overlay */}
      {isPaused && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => setIsPaused(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="bg-card/95 border-4 border-primary/40 p-8 w-full max-w-md backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

              <div className="text-center space-y-6">
                <h2 className="font-pixel text-2xl text-foreground">PAUSED</h2>

                <div className="space-y-3">
                  <Button
                    onClick={() => setIsPaused(false)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-xs"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    RESUME
                  </Button>

                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full border-secondary text-secondary hover:bg-secondary/10 font-pixel text-xs"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    RESTART
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-primary/40 text-foreground/70 hover:bg-primary/10 font-pixel text-xs"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    SETTINGS
                  </Button>

                  <Button
                    onClick={() => setShowQuitConfirm(true)}
                    variant="outline"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 font-pixel text-xs"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    QUIT
                  </Button>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
            </Card>
          </div>
        </>
      )}

      {/* Quit Confirmation */}
      {showQuitConfirm && !missionResult && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => setShowQuitConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="bg-card/95 border-4 border-destructive/40 p-8 w-full max-w-sm backdrop-blur-sm">
              <div className="text-center space-y-6">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />

                <div>
                  <h2 className="font-pixel text-lg text-foreground mb-2">QUIT MISSION?</h2>
                  <p className="text-sm text-foreground/70">
                    You will lose your progress if you quit now.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowQuitConfirm(false)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-xs"
                  >
                    CONTINUE
                  </Button>

                  <Button
                    onClick={handleQuit}
                    variant="outline"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10 font-pixel text-xs"
                  >
                    QUIT
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Mission Success Overlay */}
      {missionResult === 'success' && (
        <>
          {console.log('[🏁 ENDING UI] Rendering success ending with sessionScoreEarned:', sessionScoreEarned)}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
          
          <Card className="relative z-10 bg-card/95 backdrop-blur-sm border-4 border-primary p-10 w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            
            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="text-center space-y-6 relative">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-primary/20 border-4 border-primary rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-16 h-16 text-primary" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="font-pixel text-3xl text-primary mb-3 animate-pulse">
                  MISSION
                  <br />
                  COMPLETE
                </h2>
                <p className="text-foreground/70 text-sm">
                  Excellent work, agent! You successfully detected the phishing attempt.
                </p>
              </div>

              {/* Stats Grid - 3 columns */}
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="space-y-2">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto" />
                  <p className="font-pixel text-2xl text-foreground">+{sessionScoreEarned}</p>
                  <p className="text-xs text-foreground/60">Score Earned</p>
                </div>
                <div className="space-y-2">
                  <Zap className="w-6 h-6 text-secondary mx-auto" />
                  <p className="font-pixel text-2xl text-secondary">+{Math.round(sessionScoreEarned / 10)}</p>
                  <p className="text-xs text-foreground/60">XP Gained</p>
                </div>
                <div className="space-y-2">
                  <Award className="w-6 h-6 text-accent mx-auto" />
                  <p className="font-pixel text-2xl text-accent">+1</p>
                  <p className="text-xs text-foreground/60">Badge Unlocked</p>
                </div>
              </div>

              {/* New Badge Card */}
              <Card className="bg-accent/10 border-2 border-accent p-4">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-accent flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-pixel text-xs text-accent mb-1">NEW BADGE UNLOCKED!</p>
                    <p className="text-sm text-foreground">Email Security Expert</p>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-pixel text-sm h-12"
                  onClick={() => onNavigate?.('dashboard')}
                >
                  DASHBOARD
                </Button>
                {/* CONTINUE button only shown if NOT from teacher dialog completion */}
                {!teacherDialogCompleted && (
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-sm h-12 disabled:opacity-50"
                    disabled={isFinishingGame}  // ✅ Disable while finishGame is in progress
                    onClick={() => {
                      // Reset mission result state
                      setMissionResult(null)
                      // Keep the updated score and stats for HUD display
                      // The useEffect will create a new game session automatically
                    }}
                  >
                    {isFinishingGame ? 'SAVING...' : 'CONTINUE'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
        </>
      )}

      {/* Mission Failed Overlay */}
      {missionResult === 'failed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
          
          <Card className="relative z-10 bg-card/95 backdrop-blur-sm border-4 border-destructive p-10 w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent animate-pulse" />
            
            <div className="text-center space-y-6">
              {/* Failed Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-destructive/20 border-4 border-destructive rounded-full flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-destructive" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="font-pixel text-3xl text-destructive mb-3">
                  SIMULATION
                  <br />
                  FAILED
                </h2>
                <p className="text-foreground/70 text-sm mb-4">
                  You clicked on the malicious link and compromised your security.
                </p>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-2 gap-4 py-4 bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                <div className="space-y-2">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto" />
                  <p className="font-pixel text-2xl text-foreground">{sessionScoreEarned}</p>
                  <p className="text-xs text-foreground/60">Score Change</p>
                </div>
                <div className="space-y-2">
                  <Zap className="w-6 h-6 text-secondary mx-auto" />
                  <p className="font-pixel text-2xl text-secondary">{Math.round(sessionScoreEarned / 10)}</p>
                  <p className="text-xs text-foreground/60">XP Change</p>
                </div>
              </div>

              {/* Learning Tip Card */}
              <Card className="bg-accent/10 border-2 border-accent/50 p-4 text-left">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-pixel text-xs text-accent mb-2">SECURITY TIP</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Always verify sender emails before clicking links. Legitimate banks never ask for passwords via email.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-2 border-foreground/30 text-foreground hover:bg-foreground/10 font-pixel text-sm h-12"
                  onClick={() => onNavigate?.('dashboard')}
                >
                  DASHBOARD
                </Button>
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-pixel text-sm h-12"
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  RETRY
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SimulationPage
