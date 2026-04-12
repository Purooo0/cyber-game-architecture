import { useState } from 'react'
import {
  Mail,
  Wifi,
  Camera,
  Music2,
  Map,
  Settings,
  MessageSquare,
  Youtube,
  Chrome,
  Calculator,
  X,
  ChevronLeft,
  Battery,
  Signal,
  User,
  Lock,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'

// ─── Imports ───────────────────────────────────────────────────────────────
import { API_URL } from '../lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────
type PhoneScreen = 'home' | 'email' | 'phishing-form' | 'feedback-report' | 'feedback-delete'

// ─── Wrong-app mentor hints ─────────────────────────────────────────────────
const wrongAppHints: Record<string, string> = {
  wifi:     "Mungkin itu berguna nanti... tapi saat ini kotak masuk Anda menunggu. Notifikasi tidak akan mengabaikan diri mereka sendiri.",
  camera:   "Perhatian yang bagus untuk detail — keterampilan yang berguna. Tapi ada sesuatu di kotak masuk Anda yang memerlukan perhatian Anda terlebih dahulu.",
  music:    "Tetap tenang adalah strategi yang baik. Ketika Anda siap, pesan Anda mungkin memiliki sesuatu yang penting.",
  maps:     "Pilihan yang menarik. Terkadang tujuan paling penting ada tepat di depan Anda — seperti kotak masuk Anda.",
  settings: "Tidak ada yang terlihat salah di sini. Mungkin ada sesuatu yang lain di layar ini yang memerlukan perhatian Anda.",
  chat:     "Tidak ada pesan baru dari teman. Tapi pesan lain menunggu Anda di suatu tempat di layar ini.",
  youtube:  "Selalu ada waktu untuk video nanti. Saat ini, ada yang lain di layar ini yang lebih mendesak.",
  chrome:   "Jawaban kali ini bukan di internet. Lihat lebih dekat pada apa yang sudah ada di sini.",
  calc:     "Angka berguna — tapi perhitungan nyata yang perlu Anda buat ada di kotak masuk Anda.",
}

// ─── App grid ───────────────────────────────────────────────────────────────
const apps = [
  { id: 'wifi',     label: 'Wi-Fi',      icon: Wifi,          color: 'bg-blue-500/80',    badge: null },
  { id: 'camera',   label: 'Kamera',     icon: Camera,        color: 'bg-purple-500/80',  badge: null },
  { id: 'music',    label: 'Musik',      icon: Music2,        color: 'bg-pink-500/80',    badge: null },
  { id: 'maps',     label: 'Peta',       icon: Map,           color: 'bg-green-600/80',   badge: null },
  { id: 'email',    label: 'Surat',      icon: Mail,          color: 'bg-cyan-500/80',    badge: '1'  },
  { id: 'settings', label: 'Pengaturan', icon: Settings,      color: 'bg-slate-500/80',   badge: null },
  { id: 'chat',     label: 'Pesan',      icon: MessageSquare, color: 'bg-emerald-500/80', badge: null },
  { id: 'youtube',  label: 'Video',      icon: Youtube,       color: 'bg-red-500/80',     badge: null },
  { id: 'chrome',   label: 'Browser',    icon: Chrome,        color: 'bg-yellow-500/80',  badge: null },
  { id: 'calc',     label: 'Kalkulator', icon: Calculator,    color: 'bg-orange-500/80',  badge: null },
]

// ─── Quiz questions ─────────────────────────────────────────────────────────
interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const reportQuiz: QuizQuestion = {
  question: "Mengapa penting untuk melaporkan email yang mencurigakan daripada hanya mengabaikannya?",
  options: [
    "Sehingga email dihapus secara otomatis",
    "Sehingga sistem dapat memperingatkan orang lain dan memblokir ancaman serupa",
    "Karena pengirim akan dihukum segera",
    "Untuk mendapatkan poin bonus di sistem sekolah",
  ],
  correctIndex: 1,
  explanation: "Melaporkan email yang mencurigakan membantu sistem keamanan mengidentifikasi dan memblokir upaya phishing serupa, melindungi semua orang — bukan hanya Anda.",
}

const deleteQuiz: QuizQuestion = {
  question: "Alamat pengirim adalah 'admin@school-notice.net'. Apa yang mencurigakan tentang hal ini?",
  options: [
    "Ini menggunakan domain gratis, bukan domain resmi sekolah",
    "Ini memiliki terlalu banyak karakter",
    "Itu berisi kata 'admin'",
    "Tidak ada — itu terlihat sepenuhnya sah",
  ],
  correctIndex: 0,
  explanation: "Email sekolah yang sah menggunakan domain resmi seperti '@school.edu'. Domain gratis atau tidak dikenal seperti 'school-notice.net' adalah tanda bahaya untuk phishing.",
}

// ─── Feedback Quiz View ─────────────────────────────────────────────────────
interface FeedbackQuizProps {
  quiz: QuizQuestion
  actionLabel: string
  onSuccess: () => void
  sessionId?: string | null  // ✅ Add sessionId
  actionType?: string  // ✅ Add actionType to identify which quiz
}

function FeedbackQuizView({ quiz, actionLabel, onSuccess, sessionId, actionType }: FeedbackQuizProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const isCorrect = selected === quiz.correctIndex

  // Log feedback answer to backend
  const logFeedbackAnswer = async () => {
    if (!sessionId || !actionType || selected === null) return

    try {
      console.log(`[📝 FEEDBACK] Logging answer for ${actionType}:`, {
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
        console.log(`[📝 FEEDBACK] ✅ Answer logged:`, data)
      } else {
        console.warn(`[📝 FEEDBACK] ⚠️ Failed to log answer:`, response.statusText)
      }
    } catch (error) {
      console.error(`[📝 FEEDBACK] ❌ Error logging feedback:`, error)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[hsl(220_40%_7%)] p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 border-b-2 border-primary/30 pb-2">
        <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-pixel text-[9px] text-primary leading-tight">CYBER MENTOR — FEEDBACK CHECK</span>
      </div>

      {/* Mentor prompt */}
      <div className="border-2 border-secondary/40 bg-secondary/5 px-3 py-2 space-y-1">
        <p className="text-[9px] text-secondary font-pixel">CYBER MENTOR:</p>
        <p className="text-[10px] text-foreground/80 leading-relaxed">
          Keputusan bagus {actionLabel}. Sebelum saya mengkonfirmasi hasil Anda, jawab pertanyaan cepat ini untuk menunjukkan Anda memahami mengapa.
        </p>
      </div>

      {/* Question */}
      <p className="text-xs text-foreground/90 leading-relaxed font-sans">{quiz.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {quiz.options.map((opt, i) => {
          let style = 'border-foreground/20 bg-foreground/5 text-foreground/80 hover:border-primary/60 hover:bg-primary/10'
          if (confirmed) {
            if (i === quiz.correctIndex) style = 'border-primary bg-primary/20 text-primary'
            else if (i === selected) style = 'border-red-500 bg-red-500/10 text-red-400'
            else style = 'border-foreground/10 bg-foreground/5 text-foreground/40 cursor-default'
          } else if (selected === i) {
            style = 'border-primary/80 bg-primary/15 text-foreground'
          }

          return (
            <button
              key={i}
              disabled={confirmed}
              onClick={() => setSelected(i)}
              className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded border-2 text-[10px] leading-relaxed transition-all ${style}`}
            >
              <span className="font-pixel text-[9px] flex-shrink-0 mt-0.5">
                {String.fromCharCode(65 + i)}.
              </span>
              <span>{opt}</span>
              {confirmed && i === quiz.correctIndex && (
                <CheckCircle2 className="w-3 h-3 flex-shrink-0 ml-auto mt-0.5 text-primary" />
              )}
              {confirmed && i === selected && i !== quiz.correctIndex && (
                <XCircle className="w-3 h-3 flex-shrink-0 ml-auto mt-0.5 text-red-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* Confirm button */}
      {!confirmed && (
        <button
          disabled={selected === null}
          onClick={() => setConfirmed(true)}
          className={`w-full py-2 font-pixel text-[9px] border-2 rounded transition-all ${
            selected !== null
              ? 'border-primary text-primary hover:bg-primary/20'
              : 'border-foreground/20 text-foreground/30 cursor-not-allowed'
          }`}
        >
          KONFIRMASI JAWABAN
        </button>
      )}

      {/* Result */}
      {confirmed && (
        <div className={`border-2 px-3 py-2 space-y-2 rounded ${
          isCorrect ? 'border-primary/50 bg-primary/10' : 'border-red-500/50 bg-red-500/10'
        }`}>
          <p className={`font-pixel text-[9px] ${isCorrect ? 'text-primary' : 'text-red-400'}`}>
            {isCorrect ? '>> BENAR!' : '>> TIDAK CUKUP — LIHAT PENJELASAN:'}
          </p>
          <p className="text-[10px] text-foreground/80 leading-relaxed">{quiz.explanation}</p>
          <button
            onClick={async () => {
              await logFeedbackAnswer()  // ✅ Log feedback before success
              onSuccess()
            }}
            className="w-full py-1.5 font-pixel text-[9px] border-2 border-primary text-primary hover:bg-primary/20 rounded transition-all"
          >
            {isCorrect ? 'SELESAIKAN MISI >>' : 'MENGERTI — SELESAIKAN MISI >>'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Phishing form view ─────────────────────────────────────────────────────
interface PhishingFormProps {
  onBack: () => void
  onCancel: () => void
  onSubmit: () => void
}

function PhishingFormView({ onBack, onCancel, onSubmit }: PhishingFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ studentId: '', email: '', password: '', phone: '' })

  const allFilled = form.studentId && form.email && form.password && form.phone

  return (
    <div className="flex flex-col h-full">
      {/* Browser bar */}
      <div className="bg-[hsl(220_40%_6%)] border-b-2 border-red-500/40 px-2 py-1.5 flex items-center gap-2 flex-shrink-0">
        <button onClick={onBack} className="text-foreground/50 hover:text-foreground/80 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 bg-[hsl(220_40%_10%)] border border-red-400/30 rounded px-2 py-0.5 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
          <span className="font-sans text-[7px] text-red-400/80 truncate">
            http://school-network-verify.free-site.com/student-login
          </span>
        </div>
      </div>

      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto bg-white p-3 space-y-3">
        {/* Fake school branding */}
        <div className="text-center py-2 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
          <p className="text-[10px] font-bold text-gray-800">Portal Siswa Login</p>
          <p className="text-[8px] text-gray-500">school-network-verify.free-site.com</p>
        </div>

        {/* Form fields */}
        <div className="space-y-2">
          <div>
            <label className="text-[8px] text-gray-600 font-semibold block mb-0.5">ID Siswa</label>
            <div className="flex items-center border border-gray-300 rounded px-2 gap-1 bg-gray-50">
              <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="misal. 2024-00123"
                value={form.studentId}
                onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                className="flex-1 bg-transparent text-[9px] text-gray-800 py-1.5 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[8px] text-gray-600 font-semibold block mb-0.5">Email Sekolah</label>
            <div className="flex items-center border border-gray-300 rounded px-2 gap-1 bg-gray-50">
              <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                type="email"
                placeholder="nama@school.edu"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="flex-1 bg-transparent text-[9px] text-gray-800 py-1.5 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[8px] text-gray-600 font-semibold block mb-0.5">Kata Sandi</label>
            <div className="flex items-center border border-gray-300 rounded px-2 gap-1 bg-gray-50">
              <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Kata sandi sekolah Anda"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="flex-1 bg-transparent text-[9px] text-gray-800 py-1.5 outline-none placeholder:text-gray-400"
              />
              <button onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[8px] text-gray-600 font-semibold block mb-0.5">Nomor Telepon</label>
            <div className="flex items-center border border-gray-300 rounded px-2 gap-1 bg-gray-50">
              <span className="text-gray-400 text-[8px]">+62</span>
              <input
                type="tel"
                placeholder="08xx-xxxx-xxxx"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="flex-1 bg-transparent text-[9px] text-gray-800 py-1.5 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Submit + Exit */}
        <div className="space-y-1.5 pt-1">
          <button
            onClick={() => { if (allFilled) onSubmit() }}
            className={`w-full py-2 rounded text-[9px] font-bold text-white transition-all ${
              allFilled
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Verifikasi & Kirim
          </button>
          <button
            onClick={onCancel}
            className="w-full py-1.5 rounded text-[9px] text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Batal — Kembali
          </button>
        </div>

        <p className="text-[7px] text-gray-400 text-center leading-relaxed">
          Dengan mengirimkan, Anda setuju dengan syarat layanan dan kebijakan privasi kami.
        </p>
      </div>
    </div>
  )
}

// ─── Email view ─────────────────────────────────────────────────────────────
interface EmailViewProps {
  onBack: () => void
  onLinkClick: () => void
  onReport: () => void
  onDelete: () => void
}

function EmailView({ onBack, onLinkClick, onReport, onDelete }: EmailViewProps) {
  const [reported, setReported] = useState(false)
  const [deleted, setDeleted] = useState(false)

  if (deleted) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6 text-center">
        <Trash2 className="w-10 h-10 text-foreground/30" />
        <p className="font-pixel text-[10px] text-foreground/50">Email deleted.</p>
        <button
          onClick={onBack}
          className="text-[9px] text-cyan-400 underline font-pixel"
        >
          BACK TO HOME
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Email app header */}
      <div className="bg-cyan-900/60 border-b-2 border-cyan-400/40 px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button onClick={onBack} className="text-cyan-300 hover:text-cyan-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <Mail className="w-4 h-4 text-cyan-400" />
        <span className="font-pixel text-[9px] text-cyan-300">KOTAK MASUK</span>

        {/* Action buttons top-right */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setReported(true); onReport() }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-pixel transition-all ${
              reported
                ? 'border-accent/60 bg-accent/20 text-accent cursor-default'
                : 'border-accent/30 bg-accent/10 text-accent/70 hover:border-accent hover:text-accent hover:bg-accent/20'
            }`}
            disabled={reported}
          >
            <Flag className="w-2.5 h-2.5" />
            {reported ? 'DILAPORKAN' : 'LAPORKAN'}
          </button>
          <button
            onClick={() => { setDeleted(true); onDelete() }}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-red-400/30 bg-red-400/10 text-red-400/70 hover:border-red-400 hover:text-red-400 hover:bg-red-400/20 text-[8px] font-pixel transition-all"
          >
            <Trash2 className="w-2.5 h-2.5" />
            HAPUS
          </button>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto bg-[hsl(220_40%_7%)] p-3 space-y-3">
        {reported && (
          <div className="border border-accent/40 bg-accent/10 px-3 py-2 flex items-center gap-2 rounded">
            <Flag className="w-3 h-3 text-accent flex-shrink-0" />
            <p className="text-[9px] text-accent leading-relaxed">
              Email ini telah ditandai sebagai mencurigakan dan dilaporkan.
            </p>
          </div>
        )}

        <div className="border-2 border-cyan-400/30 bg-cyan-400/5 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[8px] text-cyan-400">BELUM DIBACA</span>
            <span className="text-[8px] text-foreground/40">10:32 AM</span>
          </div>
          <p className="text-[10px] text-foreground/60">
            Dari: <span className="text-foreground">admin@school-notice.net</span>
          </p>
          <p className="text-[10px] text-foreground/60">
            Subjek:{' '}
            <span className="text-accent font-sans text-xs">Mendesak: Pemberitahuan Akses Jaringan Sekolah</span>
          </p>
        </div>

        <div className="space-y-2 text-xs text-foreground/80 leading-relaxed">
          <p>Siswa yang Terhormat,</p>
          <p>
            Siswa dianjurkan untuk terhubung ke jaringan Wi-Fi sementara sekolah{' '}
            <span className="text-cyan-400 font-sans">&quot;SchoolNet-Free&quot;</span> untuk pemberitahuan mendesak dari administrasi.
          </p>
          <p>
            Silakan masuk menggunakan kredensial akun siswa Anda untuk mengakses pesan lengkap dan mengkonfirmasi catatan kehadiran Anda.
          </p>
          <p>Klik tautan di bawah untuk memverifikasi akun Anda sekarang juga:</p>

          {/* Clickable phishing link */}
          <button
            onClick={onLinkClick}
            className="block w-full text-left border border-accent/40 bg-accent/5 hover:bg-accent/10 px-2 py-1.5 rounded transition-colors group"
          >
            <span className="text-accent underline font-sans text-[10px] break-all group-hover:text-accent/80">
              http://school-network-verify.free-site.com/student-login
            </span>
          </button>

          <p className="text-foreground/60 text-[10px]">— Departemen IT, Administrasi Sekolah</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main PhonePopup ────────────────────────────────────────────────────────
interface PhonePopupProps {
  onClose: () => void
  onMentorMessage: (msg: string) => void
  onMissionFail: (actionType: 'clicked_malicious_link') => void
  onMissionSuccess: (actionType: 'reported_phishing' | 'deleted_phishing') => void
  onPhishingFormCancel?: () => void
  sessionId?: string | null  // ✅ Add sessionId for feedback logging
  feedbackQuestions?: any  // ✅ Add feedbackQuestions prop
}

export function PhonePopup({ onClose, onMentorMessage, onMissionFail, onMissionSuccess, onPhishingFormCancel, sessionId, feedbackQuestions }: PhonePopupProps) {
  const [screen, setScreen] = useState<PhoneScreen>('home')
  const [activeApp, setActiveApp] = useState<string | null>(null)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const handleAppClick = (appId: string) => {
    if (appId === 'email') {
      setScreen('email')
      setActiveApp('email')
    } else {
      const hint = wrongAppHints[appId] ?? "That does not seem relevant right now. Keep looking."
      onMentorMessage(hint)
      setActiveApp(appId)
      setTimeout(() => setActiveApp(null), 400)
    }
  }

  const handleFormSubmit = async () => {
    // Log the fail action and WAIT for it to complete
    await onMissionFail('clicked_malicious_link')
    
    // Then deliver scary warning
    onMentorMessage(
      "PERINGATAN: Anda baru saja mengirimkan kredensial pribadi Anda ke situs web pihak ketiga yang tidak terverifikasi. ID Siswa, email, kata sandi, dan nomor telepon Anda mungkin sekarang berada di tangan pelaku jahat. Inilah cara serangan phishing mencuri identitas Anda..."
    )
    
    // Finally close phone after delay
    setTimeout(() => {
      onClose()
    }, 3500)
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative animate-in fade-in zoom-in-95 duration-300">

        {/* Outer glow */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-cyan-400/10 blur-xl pointer-events-none" />

        {/* Phone body */}
        <div
          className="relative w-[280px] bg-[hsl(220_40%_7%)] border-4 border-primary/50 rounded-[2.5rem] overflow-hidden shadow-2xl"
          style={{ height: '560px' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-[hsl(220_40%_6%)] border-b border-primary/20 flex-shrink-0">
            <span className="font-pixel text-[8px] text-foreground/70">{timeStr}</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-primary" />
              <Wifi className="w-3 h-3 text-primary" />
              <Battery className="w-3 h-3 text-primary" />
            </div>
          </div>

          {/* Screen content */}
          <div className="flex flex-col h-[calc(100%-36px)]">

            {/* HOME SCREEN */}
            {screen === 'home' && (
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 text-center bg-gradient-to-b from-[hsl(220_60%_10%)] to-transparent flex-shrink-0">
                  <p className="font-pixel text-[8px] text-foreground/60 mb-0.5">{dateStr}</p>
                  <p className="font-pixel text-2xl text-foreground tracking-widest">{timeStr}</p>
                  <div className="mt-2 flex items-center justify-center gap-2 bg-white/5 border border-cyan-400/20 rounded-full px-3 py-1">
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] text-foreground/80">1 email baru</span>
                  </div>
                </div>

                <div className="flex-1 px-3 py-2 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-3">
                    {apps.map((app) => {
                      const Icon = app.icon
                      const isActive = activeApp === app.id
                      return (
                        <button
                          key={app.id}
                          onClick={() => handleAppClick(app.id)}
                          className={`flex flex-col items-center gap-1 group transition-transform active:scale-90 ${isActive ? 'scale-90' : ''}`}
                        >
                          <div className={`relative w-12 h-12 ${app.color} border-2 ${
                            app.id === 'email'
                              ? 'border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                              : 'border-white/20'
                          } rounded-xl flex items-center justify-center group-hover:border-white/60 transition-all`}>
                            <Icon className="w-6 h-6 text-white" />
                            {app.badge && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 border border-red-300 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-[8px] text-white font-bold">{app.badge}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-foreground/70 group-hover:text-foreground leading-none text-center transition-colors">
                            {app.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dock */}
                <div className="flex items-center justify-center gap-4 px-4 py-3 border-t-2 border-primary/20 bg-[hsl(220_40%_6%)] flex-shrink-0">
                  <button
                    onClick={() => handleAppClick('chat')}
                    className="w-12 h-12 bg-emerald-500/80 border-2 border-white/20 rounded-xl flex items-center justify-center hover:border-white/60 transition-all active:scale-90"
                  >
                    <MessageSquare className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => handleAppClick('chrome')}
                    className="w-12 h-12 bg-yellow-500/80 border-2 border-white/20 rounded-xl flex items-center justify-center hover:border-white/60 transition-all active:scale-90"
                  >
                    <Chrome className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => handleAppClick('email')}
                    className="relative w-12 h-12 bg-cyan-500/80 border-2 border-cyan-300 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.5)] hover:border-white transition-all active:scale-90"
                  >
                    <Mail className="w-6 h-6 text-white" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 border border-red-300 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-[8px] text-white font-bold">1</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAppClick('calc')}
                    className="w-12 h-12 bg-orange-500/80 border-2 border-white/20 rounded-xl flex items-center justify-center hover:border-white/60 transition-all active:scale-90"
                  >
                    <Calculator className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* EMAIL SCREEN */}
            {screen === 'email' && (
              <EmailView
                onBack={() => setScreen('home')}
                onLinkClick={() => setScreen('phishing-form')}
                onReport={() => {
                  onMentorMessage(
                    "Insting yang bagus. Melaporkan email yang mencurigakan adalah langkah yang tepat. Saya memiliki satu pertanyaan cepat untuk Anda sebelum kami melanjutkan — jawab itu untuk menyelesaikan misi."
                  )
                  setScreen('feedback-report')
                }}
                onDelete={() => {
                  onMentorMessage(
                    "Pilihan yang cerdas. Menghapus email itu adalah keputusan yang tepat. Tapi apakah Anda memperhatikan sesuatu yang spesifik yang salah? Jawab ini dan kami sudah selesai."
                  )
                  setScreen('feedback-delete')
                }}
              />
            )}

            {/* PHISHING FORM SCREEN */}
            {screen === 'phishing-form' && (
              <PhishingFormView
                onBack={() => setScreen('email')}
                onCancel={() => {
                  setScreen('email')
                  // Call specific callback for phishing form cancellation
                  onPhishingFormCancel?.()
                  onMentorMessage(
                    "Hmm... ada yang terasa tidak benar, bukan? Itu adalah insting yang baik. Mungkin guru homeroom Anda dapat membantu memverifikasi apakah pemberitahuan ini benar-benar dari sekolah."
                  )
                }}
                onSubmit={handleFormSubmit}
              />
            )}

            {/* FEEDBACK QUIZ — REPORT PATH */}
            {screen === 'feedback-report' && (
              <FeedbackQuizView
                quiz={(feedbackQuestions?.bedroom_report as QuizQuestion) || reportQuiz}
                actionLabel="reporting that email"
                sessionId={sessionId}
                actionType="reported_phishing"
                onSuccess={async () => {
                  await onMissionSuccess('reported_phishing')
                  onMentorMessage(
                    "Sempurna! Anda dengan benar mengidentifikasi dan melaporkan email phishing. Pemikiran cepat Anda melindungi jaringan sekolah. Misi berhasil!"
                  )
                  setTimeout(() => {
                    onClose()
                  }, 2000)
                }}
              />
            )}

            {/* FEEDBACK QUIZ — DELETE PATH */}
            {screen === 'feedback-delete' && (
              <FeedbackQuizView
                quiz={(feedbackQuestions?.bedroom_delete as QuizQuestion) || deleteQuiz}
                actionLabel="deleting that email"
                sessionId={sessionId}
                actionType="deleted_phishing"
                onSuccess={async () => {
                  await onMissionSuccess('deleted_phishing')
                  onMentorMessage(
                    "Sempurna! Anda dengan benar mengidentifikasi email yang mencurigakan dan menghapusnya. Kesadaran keamanan Anda mencegah potensi pelanggaran. Misi berhasil!"
                  )
                  setTimeout(() => {
                    onClose()
                  }, 2000)
                }}
              />
            )}
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-card border-2 border-accent/50 rounded-full flex items-center justify-center hover:bg-accent/20 transition-colors z-10"
        >
          <X className="w-4 h-4 text-accent" />
        </button>
      </div>
    </div>
  )
}
