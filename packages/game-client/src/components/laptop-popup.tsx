'use client'

import { useState, useEffect } from 'react'
import {
  Wifi, X, AlertTriangle, Shield, CheckCircle2, XCircle,
  HelpCircle, Lock, Globe, Eye, EyeOff, RefreshCw,
  ChevronLeft, User, Search, Star, WifiOff, Volume2,
  Battery, Signal, Folder, FileText, Image, Music,
  Trash2, HardDrive, Terminal, ChevronRight, Monitor,
  Sun, Moon, Bell, Keyboard, Mouse, Download, Code,
  Play, RotateCcw, Zap, Cpu,
} from 'lucide-react'
import { Card } from './ui/card'
import { API_URL } from '../lib/api'

type LaptopScreen =
  | 'desktop'
  | 'wifi-picker'
  | 'browser-loading'
  | 'attack-scene'
  | 'fake-portal'
  | 'feedback-evil'
  | 'feedback-safe'
  | 'files'
  | 'settings'
  | 'terminal'
  | 'vscode'

const wifiNetworks = [
  { id: 'real',     ssid: 'CafeCorner',        signal: 3, locked: true,  password: 'haruspesanduluya' },
  { id: 'evil',     ssid: 'CafeCorner',        signal: 4, locked: false, password: '' },
  { id: 'unknown1', ssid: 'AndroidAP_7F2A',    signal: 1, locked: true,  password: '' },
  { id: 'unknown2', ssid: 'HOME-NET-2.4',      signal: 2, locked: true,  password: '' },
  { id: 'unknown3', ssid: 'Indihome_92BF',     signal: 2, locked: false, password: '' },
]

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const evilTwinQuiz: QuizQuestion = {
  question: "Kamu terhubung ke jaringan terbuka dengan nama yang sama dengan WiFi kafe. Lalu lintas kamu disadap. Serangan apa ini, dan apa red flag yang kamu lewatkan?",
  options: [
    "Serangan DDoS — red flag-nya adalah koneksi yang lambat",
    "Serangan Evil Twin — red flag-nya adalah jaringan terbuka (tanpa password) dengan SSID yang sama seperti kafe",
    "Serangan Bluetooth spoofing — red flag-nya adalah perangkat yang meminta untuk berpasangan",
    "Serangan phishing — red flag-nya adalah email mencurigakan yang kamu terima",
  ],
  correctIndex: 1,
  explanation: "Serangan Evil Twin adalah ketika penyerang membuat titik akses WiFi palsu dengan SSID yang sama dengan jaringan terpercaya. Red flag yang paling jelas: WiFi asli kafe dilindungi dengan password, tetapi yang ini terbuka. Penyerang menggunakan ini untuk menyadap semua lalu lintas, mencuri kredensial, dan menyuntikkan konten berbahaya. Selalu konfirmasi nama jaringan yang benar dan jenis keamanannya dengan staf kafe.",
}

const safeQuiz: QuizQuestion = {
  question: "Kamu menemukan dua jaringan bernama 'CafeCorner' — satu terkunci, satu terbuka. Kamu memilih yang terkunci. Mengapa jaringan terbuka itu berbahaya?",
  options: [
    "Jaringan terbuka lebih lambat dan menguras baterai perangkat kamu",
    "Jaringan terbuka menyiarkan MAC address kamu secara publik",
    "Jaringan terbuka dengan nama yang sama seperti hotspot terpercaya adalah serangan Evil Twin klasik — tanpa password berarti siapa pun, termasuk penyerang, bisa menyadap lalu lintas kamu",
    "Jaringan terbuka hanya berbahaya jika kamu mengunjungi situs HTTP",
  ],
  correctIndex: 2,
  explanation: "Keputusan yang bagus. Ketika dua jaringan berbagi SSID yang sama tetapi salah satunya tidak memiliki password, yang terbuka itu hampir pasti titik akses palsu (Evil Twin). Bisnis yang sah menggunakan password untuk mengontrol akses. Dengan memilih jaringan yang aman, kamu menghindari penyadapan lalu lintas kamu. Selalu verifikasikan jaringan yang benar dengan staf.",
}

// ============ KOMPONEN: FeedbackQuizView ============
interface FeedbackQuizViewProps {
  quiz: QuizQuestion
  onSuccess: () => void
  onFail: () => void
  sessionId?: string | null  // ✅ Add sessionId
  actionType?: string  // ✅ Add actionType
}

const FeedbackQuizView: React.FC<FeedbackQuizViewProps> = ({ quiz, onSuccess, onFail, sessionId, actionType }) => {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const isCorrect = selected === quiz.correctIndex

  // Log feedback answer to backend
  const logFeedbackAnswer = async () => {
    if (!sessionId || !actionType || selected === null) return

    try {
      console.log(`[📝 CAFE FEEDBACK] Logging answer for ${actionType}:`, {
        selectedIndex: selected,
        selectedOption: quiz.options[selected],
        isCorrect
      })

      const response = await fetch(`${API_URL}/api/game/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // ✅ FIX: use 'authToken', not 'token'
        },
        body: JSON.stringify({
          sessionId,
          actionType,
          questionType: actionType.replace('_', '-'),
          questionText: quiz.question,
          selectedIndex: selected,
          selectedOption: quiz.options[selected],
          isCorrect: selected === quiz.correctIndex
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[📝 CAFE FEEDBACK] ✅ Answer logged:`, data)
      } else {
        console.warn(`[📝 CAFE FEEDBACK] ⚠️ Failed to log answer:`, response.statusText)
      }
    } catch (error) {
      console.error(`[📝 CAFE FEEDBACK] ❌ Error logging feedback:`, error)
    }
  }

  const handleConfirm = () => {
    if (selected === null) return
    setConfirmed(true)
  }

  const handleComplete = async () => {
    await logFeedbackAnswer()  // ✅ Log before callback
    if (isCorrect) {
      onSuccess()
    } else {
      onFail()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(220,40%,7%)] p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 text-primary">
        <HelpCircle className="w-4 h-4" />
        <span className="font-pixel text-xs">MENTOR SIBER — PEMERIKSAAN UMPAN BALIK</span>
      </div>

      {/* Context box */}
      <div className="border border-secondary/20 bg-secondary/5 p-3 rounded text-xs text-secondary leading-relaxed">
        <p>Pilihan-pilihanmu selama skenario ini memiliki konsekuensi. Mari kita tinjau apa yang terjadi dan apa yang telah kamu pelajari.</p>
      </div>

      {/* Question */}
      <div className="text-xs text-foreground/80 leading-relaxed">
        <p className="font-semibold mb-3">{quiz.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {quiz.options.map((option, i) => (
          <button
            key={i}
            onClick={() => !confirmed && setSelected(i)}
            disabled={confirmed}
            className={`w-full text-left px-3 py-2 rounded border text-xs transition-all ${
              confirmed
                ? i === quiz.correctIndex
                  ? 'border-primary bg-primary/20'
                  : i === selected
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-foreground/10 bg-foreground/5 opacity-50'
                : i === selected
                  ? 'border-primary bg-primary/10'
                  : 'border-foreground/10 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                i === selected ? 'border-primary bg-primary/20' : 'border-foreground/20'
              }`}>
                {confirmed && i === quiz.correctIndex && <CheckCircle2 className="w-3 h-3 text-primary" />}
                {confirmed && i === selected && i !== quiz.correctIndex && <XCircle className="w-3 h-3 text-red-500" />}
              </div>
              <span>{option}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Confirm button or result */}
      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={selected === null}
          className="w-full px-3 py-2 bg-primary/20 border border-primary/40 rounded text-xs font-semibold text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
        >
          KONFIRMASI JAWABAN
        </button>
      ) : (
        <div className="space-y-3 mt-2">
          <div className="border border-secondary/20 bg-secondary/5 p-3 rounded text-xs leading-relaxed text-foreground/80">
            <p className="font-semibold mb-2 text-secondary">Penjelasan:</p>
            <p>{quiz.explanation}</p>
          </div>
          <button
            onClick={handleComplete}
            className="w-full px-3 py-2 bg-primary/20 border border-primary/40 rounded text-xs font-semibold text-primary hover:bg-primary/30 transition-all"
          >
            {isCorrect ? 'SELESAIKAN MISI >>' : 'LANJUT'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============ KOMPONEN: WifiPickerView ============
interface WifiPickerViewProps {
  onConnect: (networkId: string) => void
  onMentorMessage: (msg: string) => void
}

const WifiPickerView: React.FC<WifiPickerViewProps> = ({ onConnect, onMentorMessage }) => {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [scanning] = useState(false)
  const [showPassword, setShowPassword] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [askingPassword, setAskingPassword] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState(false)

  const handleConnect = (net: typeof wifiNetworks[0]) => {
    if (net.id === 'evil') {
      setConnecting(net.id)
      setTimeout(() => {
        onConnect('evil')
      }, 1800)
    } else if (net.id === 'real') {
      if (net.locked && !askingPassword) {
        setAskingPassword(net.id)
        return
      }
      setConnecting(net.id)
      onMentorMessage("Pilihan yang baik! Kamu memilih jaringan yang aman. Mari kita verifikasi ini adalah jaringan yang benar.")
      setTimeout(() => {
        onConnect('real')
      }, 1800)
    } else {
      onMentorMessage("Jaringan ini tidak tersedia di sini. Coba jaringan CafeCorner.")
    }
  }

  const handlePasswordSubmit = (networkId: string) => {
    // Password for real WiFi (from staff)
    const correctPassword = 'haruspesanduluya'
    
    if (password.trim() === correctPassword) {
      // Correct password - same animation as evil twin
      setPasswordError(false)
      setAskingPassword(null)
      setPassword('')
      setConnecting(networkId)
      onMentorMessage("Sempurna! Kamu telah berhasil terhubung ke jaringan WiFi CafeCorner yang aman dengan kredensial yang benar.")
      setTimeout(() => {
        onConnect('real')
      }, 1800)
    } else if (password.trim()) {
      // Wrong password - show error state
      setPasswordError(true)
      onMentorMessage("Password salah! Pastikan kamu mendapatkan password yang benar dari staf.")
      setPassword('')
      setTimeout(() => {
        setPasswordError(false)
      }, 2000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(220,40%,7%)] p-4 gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Wifi className="w-4 h-4" />
          <span className="font-pixel text-xs">MANAJER JARINGAN</span>
        </div>
        {scanning && <div className="text-xs text-secondary">Memindai...</div>}
      </div>

      {/* Networks list */}
      <div className="space-y-2">
        {wifiNetworks.map((net) => (
          <div key={net.id}>
            <button
              onClick={() => handleConnect(net)}
              disabled={connecting !== null}
              className="w-full flex items-center justify-between px-3 py-2 rounded border transition-all border-foreground/10 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/25 disabled:opacity-50"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                {net.locked ? (
                  <Lock className="w-4 h-4 text-foreground/40" />
                ) : (
                  <Wifi className="w-4 h-4 text-foreground/40" />
                )}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground/90">{net.ssid}</div>
                  <div className="text-[10px] text-foreground/40">
                    {net.locked ? 'Aman' : 'Terbuka'}
                  </div>
                </div>
              </div>

              {/* Signal bars */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 h-2 rounded-sm ${
                      bar <= net.signal ? 'bg-foreground/60' : 'bg-foreground/15'
                    }`}
                  />
                ))}
              </div>

              {connecting === net.id && (
                <RefreshCw className="w-4 h-4 text-primary animate-spin ml-2" />
              )}
            </button>

            {/* Password prompt inline */}
            {askingPassword === net.id && (
              <div className={`border p-2 rounded text-xs space-y-2 ${passwordError ? 'border-red-500/50 bg-red-500/5' : 'border-primary/20 bg-primary/5'}`}>
                <label className="block text-foreground/70">Masukkan password:</label>
                <div className="flex gap-2 items-center">
                  <input
                    type={showPassword === net.id ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit(net.id)}
                    placeholder="Password"
                    className={`flex-1 px-2 py-1 bg-foreground/10 border rounded text-xs text-foreground placeholder-foreground/30 focus:outline-none transition-all ${passwordError ? 'border-red-500/50 focus:border-red-500/70' : 'border-foreground/20 focus:border-primary/50'}`}
                    autoFocus
                  />
                  <button
                    onClick={() => setShowPassword(showPassword === net.id ? null : net.id)}
                    className="p-1 hover:bg-foreground/10 rounded"
                  >
                    {showPassword === net.id ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-400 text-xs">❌ Password salah. Coba lagi.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAskingPassword(null)
                      setPassword('')
                      setPasswordError(false)
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-foreground/20 rounded hover:bg-foreground/5 transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => handlePasswordSubmit(net.id)}
                    disabled={!password.trim()}
                    className="flex-1 px-2 py-1 text-xs bg-primary/20 border border-primary/40 rounded hover:bg-primary/30 disabled:opacity-50 transition-all"
                  >
                    SAMBUNG
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ KOMPONEN: CaptivePortalView ============
interface CaptivePortalViewProps {
  onSubmit: () => void
  onCancel: () => void
  onBack: () => void
}

const CaptivePortalView: React.FC<CaptivePortalViewProps> = ({ onSubmit, onCancel, onBack }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const isFormComplete = formData.fullName.trim() && formData.email.trim() && formData.password.trim()

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Browser header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-100">
        <button onClick={onBack} className="p-1 hover:bg-gray-200 rounded">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-white border border-red-300 rounded text-xs">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="text-red-600">http://kafepixel-login.net/connect</span>
          <span className="text-red-500 text-[10px]">Not Secure</span>
        </div>
      </div>

      {/* Portal content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">KafePixel WiFi</h2>
            <p className="text-xs text-gray-600 mt-1">Connect to our network</p>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="flex gap-2 items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Enter password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 hover:bg-gray-200 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={!isFormComplete}
            className={`w-full py-2 rounded font-semibold text-sm transition-all ${
              isFormComplete
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            Connect
          </button>

          {/* Footer text */}
          <p className="text-[10px] text-gray-600 text-center">
            By connecting, you agree to our terms and allow network monitoring.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============ KOMPONEN: FilesApp ============
interface FilesAppProps {
  onBack: () => void
}

const FilesApp: React.FC<FilesAppProps> = ({ onBack }) => {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const folders = [
    { id: 'documents', name: 'Documents', count: 12, Icon: FileText },
    { id: 'downloads', name: 'Downloads', count: 8, Icon: Download },
    { id: 'pictures', name: 'Pictures', count: 45, Icon: Image },
    { id: 'music', name: 'Music', count: 234, Icon: Music },
    { id: 'trash', name: 'Trash', count: 3, Icon: Trash2 },
    { id: 'applications', name: 'Applications', count: 28, Icon: Folder },
  ]

  const files: { [key: string]: Array<{ name: string; type: string; size: string }> } = {
    documents: [
      { name: 'passwords_backup.txt', type: 'Text', size: '2.3 KB' },
      { name: 'university_essay.docx', type: 'Document', size: '45 KB' },
      { name: 'project_plan.pdf', type: 'PDF', size: '1.2 MB' },
      { name: 'notes.txt', type: 'Text', size: '15 KB' },
    ],
    downloads: [
      { name: 'installer.exe', type: 'Executable', size: '250 MB' },
      { name: 'photo.jpg', type: 'Image', size: '3.5 MB' },
    ],
    pictures: [
      { name: 'vacation.jpg', type: 'Image', size: '5.2 MB' },
      { name: 'family_photo.png', type: 'Image', size: '2.8 MB' },
    ],
    music: [
      { name: 'song.mp3', type: 'Audio', size: '8.5 MB' },
    ],
    trash: [],
    applications: [],
  }

  const currentFiles = currentFolder ? files[currentFolder] || [] : []

  return (
    <div className="flex flex-col h-full bg-[hsl(220,40%,7%)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-foreground/10 bg-[hsl(220,30%,10%)]">
        <button
          onClick={onBack}
          className="p-1 hover:bg-foreground/10 rounded text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="flex-1 text-xs font-pixel text-foreground/60">
          {currentFolder ? currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1) : 'Home'}
        </span>
        <Folder className="w-4 h-4 text-foreground/40" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!currentFolder && (
          <div className="w-32 border-r border-foreground/10 bg-[hsl(220,35%,8%)] p-2 space-y-1 overflow-y-auto">
            {folders.map((folder) => {
              const Icon = folder.Icon
              return (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-all"
                >
                  <Icon className="w-3 h-3" />
                  <span className="truncate">{folder.name}</span>
                </button>
              )
            })}

            {/* Storage bar */}
            <div className="mt-4 pt-2 border-t border-foreground/10">
              <div className="text-[10px] text-foreground/50 mb-1">Storage</div>
              <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary/60" style={{ width: '48%' }} />
              </div>
              <div className="text-[10px] text-foreground/40 mt-1">62 GB / 128 GB</div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 p-3 overflow-y-auto">
          {!currentFolder ? (
            /* Grid view */
            <div className="grid grid-cols-3 gap-3">
              {folders.map((folder) => {
                const Icon = folder.Icon
                return (
                  <button
                    key={folder.id}
                    onClick={() => setCurrentFolder(folder.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded border border-foreground/10 hover:bg-foreground/5 hover:border-foreground/20 transition-all"
                  >
                    <Icon className="w-8 h-8 text-foreground/60" />
                    <div className="text-[10px] text-foreground/70 text-center">{folder.name}</div>
                    <div className="text-[9px] text-foreground/40">{folder.count} items</div>
                  </button>
                )
              })}
            </div>
          ) : (
            /* File list view */
            <div className="space-y-0.5">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] text-foreground/50 border-b border-foreground/10 mb-1">
                <div className="col-span-7">NAME</div>
                <div className="col-span-3">TYPE</div>
                <div className="col-span-2">SIZE</div>
              </div>
              {/* Files */}
              {currentFiles.map((file, i) => (
                <div
                  key={i}
                  onClick={() => setSelected(file.name)}
                  className={`grid grid-cols-12 gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                    selected === file.name
                      ? 'bg-primary/20 border border-primary/40'
                      : 'hover:bg-foreground/5 border border-transparent'
                  }`}
                >
                  <div className="col-span-7 flex items-center gap-2 truncate text-foreground/80">
                    <FileText className="w-3 h-3 flex-shrink-0 text-foreground/40" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="col-span-3 text-foreground/60">{file.type}</div>
                  <div className="col-span-2 text-foreground/60">{file.size}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ KOMPONEN: SettingsApp ============
interface SettingsAppProps {
  onBack: () => void
}

const SettingsApp: React.FC<SettingsAppProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('display')
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [brightness, setBrightness] = useState(72)
  const [volume, setVolume] = useState(55)
  const [bluetooth, setBluetooth] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [firewall, setFirewall] = useState(true)

  const sections = [
    { id: 'display', name: 'Display', Icon: Monitor },
    { id: 'sound', name: 'Sound', Icon: Volume2 },
    { id: 'network', name: 'Network', Icon: Wifi },
    { id: 'notifications', name: 'Notifications', Icon: Bell },
    { id: 'keyboard', name: 'Keyboard', Icon: Keyboard },
    { id: 'mouse', name: 'Mouse', Icon: Mouse },
    { id: 'security', name: 'Security', Icon: Shield },
    { id: 'system', name: 'System', Icon: Cpu },
  ]

  const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
    checked,
    onChange,
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-all ${
        checked ? 'bg-primary/80' : 'bg-foreground/20'
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full bg-white transition-all ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )

  return (
    <div className="flex h-full bg-[hsl(220,40%,7%)]">
      {/* Sidebar */}
      <div className="w-36 border-r border-foreground/10 bg-[hsl(220,35%,8%)] p-2 space-y-1 overflow-y-auto">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-all mb-2"
        >
          <ChevronLeft className="w-3 h-3" />
          Back
        </button>
        {sections.map((section) => {
          const Icon = section.Icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-all ${
                activeSection === section.id
                  ? 'bg-primary/20 border border-primary/40 text-primary'
                  : 'hover:bg-foreground/10 text-foreground/70 hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="truncate">{section.name}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {activeSection === 'display' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Display Settings</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Dark Mode</span>
              <Toggle checked={darkMode} onChange={setDarkMode} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/70">Brightness</span>
                <span className="text-foreground/50">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        )}

        {activeSection === 'sound' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Sound Settings</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/70">Volume</span>
                <span className="text-foreground/50">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        )}

        {activeSection === 'network' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Network Settings</h3>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <WifiOff className="w-3 h-3" />
              <span>Not connected</span>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Notifications</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Enable Notifications</span>
              <Toggle checked={notifications} onChange={setNotifications} />
            </div>
          </div>
        )}

        {activeSection === 'keyboard' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Keyboard Settings</h3>
            <div className="text-xs text-foreground/70">Keyboard layout: US English</div>
          </div>
        )}

        {activeSection === 'mouse' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Mouse Settings</h3>
            <div className="text-xs text-foreground/70">Pointer speed: Normal</div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Security Settings</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Firewall</span>
              <Toggle checked={firewall} onChange={setFirewall} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Auto Update</span>
              <Toggle checked={autoUpdate} onChange={setAutoUpdate} />
            </div>
          </div>
        )}

        {activeSection === 'system' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">System Information</h3>
            <div className="text-xs space-y-2 text-foreground/70">
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span>OS</span>
                <span>CyberOS 3.2</span>
              </div>
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span>Memory</span>
                <span>8 GB RAM</span>
              </div>
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span>Storage</span>
                <span>128 GB SSD</span>
              </div>
              <div className="flex justify-between">
                <span>CPU</span>
                <span>Intel i7 @ 2.4GHz</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ KOMPONEN: TerminalApp ============
interface TerminalAppProps {
  onBack: () => void
}

const TerminalApp: React.FC<TerminalAppProps> = ({ onBack }) => {
  const [history, setHistory] = useState<Array<{ cmd: string; output: string }>>([
    { cmd: 'ls', output: 'Documents  Downloads  Pictures  Music  Applications' },
  ])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()

    let output = ''
    switch (trimmed) {
      case 'help':
        output = 'Available commands: ls, pwd, whoami, ifconfig, ping 8.8.8.8, netstat, clear, help'
        break
      case 'ls':
        output = 'Documents  Downloads  Pictures  Music  Applications'
        break
      case 'pwd':
        output = '/home/student'
        break
      case 'whoami':
        output = 'student'
        break
      case 'ifconfig':
        output = 'eth0: inet 192.168.4.102  netmask 255.255.255.0\ngateway: 192.168.4.1'
        break
      case 'ping 8.8.8.8':
        output = 'PING 8.8.8.8 (8.8.8.8): 56 data bytes\n64 bytes from 8.8.8.8: icmp_seq=0 ttl=56 time=28.4 ms'
        break
      case 'netstat':
        output = 'Active Internet connections (tcp)\nProto Recv-Q Send-Q Local Address Foreign Address State'
        break
      case 'clear':
        setHistory([])
        setInput('')
        return
      default:
        output = `Command not found: ${cmd}`
    }

    setHistory([...history, { cmd, output }])
    setCmdHistory([...cmdHistory, cmd])
    setInput('')
    setHistoryIdx(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        executeCommand(input)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = historyIdx + 1
      if (newIdx < cmdHistory.length) {
        setHistoryIdx(newIdx)
        setInput(cmdHistory[cmdHistory.length - 1 - newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1
        setHistoryIdx(newIdx)
        setInput(cmdHistory[cmdHistory.length - 1 - newIdx])
      } else if (historyIdx === 0) {
        setHistoryIdx(-1)
        setInput('')
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(220,40%,7%)] p-3 font-mono text-xs">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-foreground/10">
        <button
          onClick={onBack}
          className="p-1 hover:bg-foreground/10 rounded text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-foreground/60">Terminal</span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto space-y-1 text-foreground/80">
        {history.map((item, i) => (
          <div key={i}>
            <div className="text-primary/80">
              <span>student@cyberost:~$ </span>
              <span>{item.cmd}</span>
            </div>
            <div className="text-foreground/70 whitespace-pre-wrap break-words">{item.output}</div>
          </div>
        ))}

        {/* Current input */}
        <div className="flex items-center">
          <span className="text-primary/80">student@cyberost:~$ </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground"
            autoFocus
          />
          <span className="w-2 h-3.5 bg-primary/70 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ============ KOMPONEN: VSCodeApp ============
interface VSCodeAppProps {
  onBack: () => void
}

const VSCodeApp: React.FC<VSCodeAppProps> = ({ onBack }) => {
  const [activeFile, setActiveFile] = useState('index.html')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const files = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Café WiFi Portal</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to KafePixel</h1>
    <button onclick="loadScript()">Connect</button>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
    'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background: #f0f0f0;
}

.container {
  max-width: 600px;
  margin: 100px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
}`,
    'main.js': `function loadScript() {
  console.log('Loading main script...');
  fetch('/api/user/data').then(r => r.json());
}

function handleConnection(network) {
  console.log('Connected to:', network);
}`,
    'README.md': `# CyberOS Project

This is a sample project demonstrating web security concepts.

## Features
- Network simulation
- Security awareness training
- Interactive tutorials

## Installation
\`\`\`bash
npm install
npm start
\`\`\``,
  }

  const fileList = Object.keys(files) as Array<keyof typeof files>

  const getCode = () => {
    return files[activeFile as keyof typeof files] || ''
  }

  const codeLines = getCode().split('\n')

  return (
    <div className="flex flex-col h-full bg-[hsl(220,40%,7%)]">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[hsl(220,35%,8%)] border-b border-foreground/10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-foreground/10 rounded text-foreground/70"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-pixel text-foreground/60">VS Code</span>
        </div>
      </div>

      {/* Menu bar */}
      <div className="flex gap-4 px-3 py-1 bg-[hsl(220,35%,8%)] border-b border-foreground/10 text-xs text-foreground/60">
        <span className="hover:text-foreground cursor-pointer">File</span>
        <span className="hover:text-foreground cursor-pointer">Edit</span>
        <span className="hover:text-foreground cursor-pointer">View</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <div className="w-8 bg-[hsl(220,15%,10%)] border-r border-foreground/10 flex flex-col items-center py-3 gap-4">
          <Folder className="w-4 h-4 text-primary" />
          <Search className="w-4 h-4 text-foreground/40 hover:text-foreground/60" />
          <RefreshCw className="w-4 h-4 text-foreground/40 hover:text-foreground/60" />
          <Zap className="w-4 h-4 text-foreground/40 hover:text-foreground/60" />
        </div>

        {/* File tree */}
        {sidebarOpen && (
          <div className="w-36 bg-[hsl(220,35%,8%)] border-r border-foreground/10 p-2 overflow-y-auto">
            <div className="text-[10px] text-foreground/50 font-semibold mb-2">EXPLORER</div>
            <div className="space-y-1">
              {fileList.map((file) => (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left px-2 py-1 text-xs rounded transition-all ${
                    activeFile === file
                      ? 'bg-primary/20 text-primary'
                      : 'text-foreground/70 hover:bg-foreground/10'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-[hsl(220,40%,7%)] overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-foreground/10 overflow-x-auto bg-[hsl(220,35%,8%)]">
            {fileList.map((file) => (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`px-3 py-1.5 text-xs border-b-2 whitespace-nowrap transition-all ${
                  activeFile === file
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                {file}
              </button>
            ))}
          </div>

          {/* Code editor */}
          <div className="flex-1 flex overflow-hidden">
            {/* Line numbers */}
            <div className="w-7 bg-[hsl(220,35%,8%)] border-r border-foreground/10 text-[10px] text-foreground/20 p-1 overflow-y-auto font-mono">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code */}
            <div className="flex-1 overflow-auto">
              <pre className="text-xs text-foreground/80 font-mono p-3 leading-relaxed">
                <code>{getCode()}</code>
              </pre>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-blue-700/60 border-t border-foreground/10 text-[10px] text-foreground/80">
            <div>Ln 1, Col 1</div>
            <div>UTF-8</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ KOMPONEN: BrowserLoadingView ============
interface BrowserLoadingViewProps {
  onAttackReady: () => void
}

const BrowserLoadingView: React.FC<BrowserLoadingViewProps> = ({ onAttackReady }) => {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'intercept'>('loading')

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 12 + 4
        if (newProgress >= 72) {
          setPhase('intercept')
          return 72
        }
        return newProgress
      })
    }, 120)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (phase === 'intercept') {
      const timeout = setTimeout(() => {
        onAttackReady()
      }, 1200)
      return () => clearTimeout(timeout)
    }
  }, [phase, onAttackReady])

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-6 gap-4">
      {phase === 'loading' ? (
        <>
          <Globe className="w-12 h-12 text-blue-500 animate-pulse" />
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-800 mb-2">Menghubungkan...</div>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2">{Math.floor(progress)}%</div>
          </div>
        </>
      ) : (
        <>
          <AlertTriangle className="w-12 h-12 text-orange-500" />
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-800">Koneksi disadap...</div>
            <div className="text-xs text-gray-600 mt-1">Menganalisis lalu lintas...</div>
          </div>
        </>
      )}
    </div>
  )
}

// ============ KOMPONEN: AttackSceneView ============
interface AttackSceneViewProps {
  onContinue: () => void
}

const AttackSceneView: React.FC<AttackSceneViewProps> = ({ onContinue }) => {
  const [step, setStep] = useState(0)

  const packets = [
    { label: 'HTTP GET /search', data: 'google.com', color: 'text-green-400' },
    { label: 'Pertanyaan DNS', data: '8.8.8.8 → 192.168.4.1', color: 'text-blue-400' },
    { label: 'Cookie Header', data: 'session_id=abc123xyz', color: 'text-yellow-400' },
    { label: 'POST /login', data: 'user=siswa&pass=••••••', color: 'text-red-400' },
    { label: 'Otentikasi', data: 'Bearer eyJ0eXAi...', color: 'text-orange-400' },
  ]

  useEffect(() => {
    if (step < packets.length) {
      const timeout = setTimeout(() => {
        setStep(step + 1)
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [step, packets.length])

  return (
    <div className="flex flex-col h-full bg-[hsl(220,40%,7%)] p-4 gap-4 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-pixel text-xs">VISUALISASI SERANGAN</span>
      </div>

      {/* Packets */}
      <div className="space-y-2">
        {packets.map((packet, i) => (
          <div
            key={i}
            className={`border rounded p-2 text-xs transition-all ${
              i < step
                ? `border-${packet.color.split('-')[2]}-500/30 bg-${packet.color.split('-')[2]}-500/10`
                : 'border-foreground/10 bg-foreground/5 opacity-50'
            }`}
          >
            <div className={`font-semibold ${packet.color}`}>{packet.label}</div>
            <div className="text-foreground/60 text-[10px] mt-1">{packet.data}</div>
          </div>
        ))}
      </div>

      {/* Network topology */}
      {step >= packets.length && (
        <div className="mt-4 pt-4 border-t border-foreground/10">
          <div className="text-xs text-foreground/70 mb-3">Topologi Jaringan:</div>
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <div className="flex flex-col items-center">
              <Monitor className="w-6 h-6 text-blue-400 mb-1" />
              <span>LAPTOPKU</span>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 via-red-400 to-gray-400 mx-2" />
            <div className="flex flex-col items-center">
              <Wifi className="w-6 h-6 text-red-400 mb-1 animate-pulse" />
              <span>EVIL TWIN</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-400 mx-2" />
            <div className="flex flex-col items-center">
              <Globe className="w-6 h-6 text-gray-400 mb-1" />
              <span>INTERNET</span>
            </div>
          </div>
        </div>
      )}

      {/* Warning box */}
      {step >= packets.length && (
        <div className="mt-4 p-3 border border-red-500/40 bg-red-500/10 rounded space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground/80">
              <p className="font-semibold text-red-400 mb-1">Serangan Terdeteksi!</p>
              <p>Lalu lintas kamu telah disadap oleh titik akses WiFi palsu. Penyerang menangkap kredensial loginmu dan data browsing kamu.</p>
            </div>
          </div>
          <button
            onClick={onContinue}
            className="w-full px-3 py-2 bg-primary/20 border border-primary/40 rounded text-xs font-semibold text-primary hover:bg-primary/30 transition-all mt-2"
          >
            LIHAT APA YANG SALAH &gt;&gt;
          </button>
        </div>
      )}
    </div>
  )
}

// ============ KOMPONEN: WiFiManagerDialog ============
interface WiFiManagerDialogProps {
  connectedTo: string | null
  onClose: () => void
}

const WiFiManagerDialog: React.FC<WiFiManagerDialogProps> = ({ connectedTo, onClose }) => {
  const [displayedText, setDisplayedText] = useState('')

  // Friend's dialog about WiFi choice
  const dialogText = connectedTo === 'evil'
    ? "Hey, I'm confused about which WiFi to use. I see there are two networks with the same name, but one doesn't have a password. I thought, why complicate things? Let me just connect to the easy one. I connected to it a while ago without really thinking about it."
    : "yang gampang aja nggak sih, ada WiFi yang nggak dikunci ada tuh"

  // Display text immediately
  useEffect(() => {
    setDisplayedText(dialogText)
  }, [dialogText])

  // Auto-close based on text length
  useEffect(() => {
    const readingTimeMs = Math.max(8000, dialogText.length * 30)
    const timer = setTimeout(() => {
      onClose()
    }, readingTimeMs)
    return () => clearTimeout(timer)
  }, [dialogText, onClose])

  const handleTextClick = () => {
    onClose()
  }

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 pointer-events-auto"
        onClick={onClose}
      />

      {/* Dialog Card - positioned at bottom like NPCDialogSystem */}
      <div className="absolute bottom-4 left-4 right-4 z-40">
        <Card className="bg-card border-4 border-secondary/40 p-4 relative overflow-hidden shadow-lg shadow-secondary/20">
          {/* Decorative top glow line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-secondary" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-secondary" />

          <div className="flex gap-4 items-start">
            {/* Dialog content */}
            <div className="flex-1 space-y-2">
              {/* Speaker name header */}
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-secondary">PASMAN</span>
                <div className="w-2 h-2 bg-secondary rounded-full" />
              </div>
              
              {/* Dialog text */}
              <p className="text-sm text-foreground/90 leading-relaxed min-h-[3rem]">
                {displayedText}
              </p>
            </div>
          </div>

          {/* Click to continue */}
          <div
            className="flex items-center justify-end mt-3 pt-3 border-t border-secondary/20 cursor-pointer group"
            onClick={handleTextClick}
          >
            <span className="font-pixel text-[9px] text-secondary/60 group-hover:text-secondary transition-colors">
              CLICK TO CONTINUE &gt;&gt;
            </span>
          </div>

          {/* Decorative bottom line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
        </Card>
      </div>
    </>
  )
}

// ============ KOMPONEN: DesktopView ============
interface DesktopViewProps {
  connectedTo: string | null
  onOpenApp: (app: LaptopScreen) => void
  onMentorMessage: (msg: string) => void
}

const DesktopView: React.FC<DesktopViewProps> = ({ connectedTo, onOpenApp, onMentorMessage }) => {
  const [activeIcon, setActiveIcon] = useState<string | null>(null)

  const icons = [
    { id: 'browser', label: 'Browser', bg: 'bg-blue-600', Icon: Globe },
    { id: 'files', label: 'Files', bg: 'bg-yellow-600', Icon: Folder },
    { id: 'vscode', label: 'VS Code', bg: 'bg-blue-800', Icon: Code },
    { id: 'terminal', label: 'Terminal', bg: 'bg-gray-800', Icon: Terminal },
    { id: 'settings', label: 'Settings', bg: 'bg-slate-600', Icon: Shield },
    { id: 'wifi', label: 'Network', bg: 'bg-cyan-700', Icon: Wifi },
  ]

  const handleIcon = (id: string) => {
    setActiveIcon(id)
    setTimeout(() => setActiveIcon(null), 200)

    if (id === 'wifi') {
      onOpenApp('wifi-picker')
    } else if (id === 'browser') {
      if (connectedTo === 'evil') {
        onOpenApp('browser-loading')
      } else if (connectedTo === 'real') {
        onOpenApp('feedback-safe')
      } else {
        onMentorMessage('You need to connect to a WiFi network first. Check the Network app.')
      }
    } else if (id === 'files') {
      onOpenApp('files')
    } else if (id === 'settings') {
      onOpenApp('settings')
    } else if (id === 'terminal') {
      onOpenApp('terminal')
    } else if (id === 'vscode') {
      onOpenApp('vscode')
    }
  }

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, hsl(220 60% 10%) 0%, hsl(200 60% 8%) 50%, hsl(240 40% 12%) 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 25%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 26%, transparent 27%, transparent 74%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 75%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 76%, transparent 77%, transparent 100%),
            linear-gradient(90deg, transparent 24%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 25%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 26%, transparent 27%, transparent 74%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 75%, rgba(${Math.round(41 * 255 / 100)} ${Math.round(121 * 255 / 100)} ${Math.round(255 * 255 / 100)}, 0.05) 76%, transparent 77%, transparent 100%)
          `,
          backgroundSize: '32px 32px',
        }}
        pointer-events="none"
      />

      <div className="relative w-full h-full flex flex-col">
        {/* Desktop icons */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-6 gap-6 w-fit">
            {icons.map((icon) => {
              const Icon = icon.Icon
              const showDot =
                (icon.id === 'wifi' && connectedTo) ||
                (icon.id === 'browser' && connectedTo === 'evil')

              return (
                <button
                  key={icon.id}
                  onClick={() => handleIcon(icon.id)}
                  className={`flex flex-col items-center gap-2 transition-transform ${
                    activeIcon === icon.id ? 'scale-90' : 'hover:scale-105'
                  }`}
                >
                  {/* Indicator dot */}
                  {showDot && (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        connectedTo === 'evil'
                          ? 'bg-orange-400 animate-pulse'
                          : 'bg-primary'
                      }`}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg ${icon.bg} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Label */}
                  <span className="text-xs text-foreground/80 text-center w-16 truncate">
                    {icon.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Taskbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur border-t border-foreground/10">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-primary" />
            <Globe className="w-4 h-4 text-foreground/60" />
          </div>

          {/* Center: Time */}
          <div className="flex flex-col items-center gap-0.5 text-[10px] font-pixel text-foreground/70">
            <div>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 text-foreground/60">
            {connectedTo ? (
              <Wifi className="w-4 h-4 text-primary" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <Volume2 className="w-4 h-4" />
            <Battery className="w-4 h-4" />
            <Signal className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ MAIN EXPORT: LaptopPopup ============
interface LaptopPopupProps {
  sessionId?: string | null
  onClose: () => void
  onMentorMessage: (msg: string) => void
  onMissionFail: () => void
  onMissionSuccess: () => void
  onScorePenalty?: (penalty: number) => void
  feedbackQuestions?: any  // ✅ Add feedbackQuestions prop
}

export const LaptopPopup: React.FC<LaptopPopupProps> = ({
  sessionId,
  onClose,
  onMentorMessage,
  onMissionFail,
  onMissionSuccess,
  onScorePenalty,
  feedbackQuestions,  // ✅ Add to destructuring
}) => {
  const [screen, setScreen] = useState<LaptopScreen>('desktop')
  const [connectedTo, setConnectedTo] = useState<string | null>(null)
  const [showWiFiDialog, setShowWiFiDialog] = useState(false)

  const handleConnect = async (networkId: string) => {
    setConnectedTo(networkId)
    
    // Apply score penalty/bonus immediately by calling parent callback
    // This will trigger logGameAction on the backend with 'penalty' or 'bonus' action type
    if (networkId === 'evil') {
      // Bad choice: connected to evil twin WiFi
      await onScorePenalty?.(-20) // Will trigger logGameAction('penalty') on parent - WAIT for it to complete
      console.log('[LaptopPopup] Connected to evil WiFi - penalty applied')
    } else if (networkId === 'real') {
      // Good choice: connected to correct WiFi
      await onScorePenalty?.(20) // Will trigger logGameAction('bonus') on parent - WAIT for it to complete
      console.log('[LaptopPopup] Connected to correct WiFi - bonus applied')
    }
    
    // After connecting, return to desktop
    // Player will then freely browse
    setScreen('desktop')
  }

  const handlePortalSubmit = async () => {
    onMentorMessage('WARNING: You handed your credentials to an attacker. Your account is now compromised.')
    setTimeout(async () => {
      await onMissionFail()
      onClose()
    }, 2500)
  }

  const handleAttackContinue = () => {
    setScreen('feedback-evil')
  }

  const goBack = () => setScreen('desktop')

  // Trigger WiFi dialog when wifi-picker is opened
  useEffect(() => {
    if (screen === 'wifi-picker') {
      setShowWiFiDialog(true)
    }
  }, [screen])

  const screenContent = {
    desktop: (
      <DesktopView
        connectedTo={connectedTo}
        onOpenApp={setScreen}
        onMentorMessage={onMentorMessage}
      />
    ),
    'wifi-picker': (
      <WifiPickerView onConnect={handleConnect} onMentorMessage={onMentorMessage} />
    ),
    files: <FilesApp onBack={goBack} />,
    settings: <SettingsApp onBack={goBack} />,
    terminal: <TerminalApp onBack={goBack} />,
    vscode: <VSCodeApp onBack={goBack} />,
    'browser-loading': <BrowserLoadingView onAttackReady={() => setScreen('attack-scene')} />,
    'attack-scene': <AttackSceneView onContinue={handleAttackContinue} />,
    'fake-portal': (
      <CaptivePortalView onSubmit={handlePortalSubmit} onCancel={goBack} onBack={goBack} />
    ),
    'feedback-evil': feedbackQuestions?.cafe_evil_twin && (
      <FeedbackQuizView
        quiz={feedbackQuestions.cafe_evil_twin}
        sessionId={sessionId}  // ✅ Pass sessionId
        actionType="cafe_evil_twin"  // ✅ Pass actionType
        onSuccess={async () => {
          // Scoring already applied when connecting to evil WiFi
          await onMissionFail()
          onClose()
        }}
        onFail={async () => {
          // Scoring already applied when connecting to evil WiFi
          await onMissionFail()
          onClose()
        }}
      />
    ),
    'feedback-safe': feedbackQuestions?.cafe_safe_choice && (
      <FeedbackQuizView
        quiz={feedbackQuestions.cafe_safe_choice}
        sessionId={sessionId}  // ✅ Pass sessionId
        actionType="cafe_safe_choice"  // ✅ Pass actionType
        onSuccess={async () => {
          // Scoring already applied when connecting to correct WiFi
          await onMissionSuccess()
          onClose()
        }}
        onFail={async () => {
          // Scoring already applied when connecting to correct WiFi
          // But mission still fails because they got the feedback question wrong
          await onMissionFail()
          onClose()
        }}
      />
    ),
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-md">
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/8 rounded-full blur-3xl" />
      </div>

      {/* Laptop - Centered dan presisi */}
      <div className="relative animate-in zoom-in-95 duration-300 flex flex-col items-center">
        {/* Screen */}
        <div className="w-[900px] border-4 border-primary/40 rounded-t-2xl overflow-hidden bg-[hsl(220,40%,7%)]">
          {/* Top gradient line */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Camera bar */}
          <div className="py-2 bg-[hsl(220,40%,7%)] flex justify-center border-b border-foreground/10">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
          </div>

          {/* Content - Fixed height */}
          <div className="h-[540px] relative overflow-hidden">
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 z-10 pointer-events-none opacity-[0.025]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)',
              }}
            />

            {/* Screen content */}
            <div className="h-full overflow-hidden">
              {screenContent[screen as LaptopScreen]}
            </div>
          </div>

          {/* Bottom gradient line */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent" />
        </div>

        {/* Hinge - Presisi */}
        <div className="w-[940px] h-2.5 bg-[hsl(220,30%,8%)] border-x-4 border-primary/20 flex items-center justify-center">
          <div className="w-20 h-1.5 bg-primary/20 rounded-full" />
        </div>

        {/* Keyboard base - Ukuran dan layout diperbaiki */}
        <div className="w-[940px] bg-[hsl(220,25%,10%)] border-4 border-primary/30 border-t-0 rounded-b-2xl px-8 py-4 space-y-2.5">
          {/* Keyboard rows - dengan spacing lebih baik */}
          <div className="flex gap-1.5 justify-center">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
              <div
                key={key}
                className="w-8 h-7 bg-[hsl(220,30%,14%)] border border-primary/10 rounded text-xs flex items-center justify-center text-foreground/50 hover:bg-[hsl(220,30%,16%)] transition-colors"
              >
                {key}
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 justify-center ml-2">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
              <div
                key={key}
                className="w-8 h-7 bg-[hsl(220,30%,14%)] border border-primary/10 rounded text-xs flex items-center justify-center text-foreground/50 hover:bg-[hsl(220,30%,16%)] transition-colors"
              >
                {key}
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 justify-center ml-4">
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
              <div
                key={key}
                className="w-8 h-7 bg-[hsl(220,30%,14%)] border border-primary/10 rounded text-xs flex items-center justify-center text-foreground/50 hover:bg-[hsl(220,30%,16%)] transition-colors"
              >
                {key}
              </div>
            ))}
          </div>

          {/* Spacebar row - dengan proporsi lebih baik */}
          <div className="flex gap-1.5 justify-center mt-3">
            <div className="w-8 h-7 bg-[hsl(220,30%,14%)] border border-primary/10 rounded hover:bg-[hsl(220,30%,16%)] transition-colors" />
            <div className="w-64 h-7 bg-[hsl(220,30%,14%)] border border-primary/10 rounded hover:bg-[hsl(220,30%,16%)] transition-colors" />
            <div className="w-8 h-7 bg-[hsl(220,30%,14%)] border border-primary/10 rounded hover:bg-[hsl(220,30%,16%)] transition-colors" />
          </div>

          {/* Trackpad - Ukuran lebih baik */}
          <div className="flex justify-center mt-3 pt-2 border-t border-foreground/10">
            <div className="w-36 h-10 bg-[hsl(220,30%,13%)] border border-primary/10 rounded-sm" />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-9 h-9 rounded-full border-2 border-accent/50 bg-background flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-all shadow-lg"
        >
          <X className="w-5 h-5 text-accent" />
        </button>
      </div>

      {/* WiFi Manager Dialog - overlay like mentor dialog */}
      {showWiFiDialog && (
        <WiFiManagerDialog
          connectedTo={connectedTo}
          onClose={() => setShowWiFiDialog(false)}
        />
      )}
    </div>
  )
}

export default LaptopPopup
