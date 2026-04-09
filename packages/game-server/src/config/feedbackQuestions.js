/**
 * Feedback Questions Configuration
 * Contains all quiz questions used throughout the game
 */

export const feedbackQuestions = {
  // ─── BEDROOM SCENARIO QUESTIONS ─────────────────────────────────
  bedroom_report: {
    question: "Mengapa penting untuk melaporkan email yang mencurigakan daripada hanya mengabaikannya?",
    options: [
      "Sehingga email dihapus secara otomatis",
      "Sehingga sistem dapat memperingatkan orang lain dan memblokir ancaman serupa",
      "Karena pengirim akan dihukum segera",
      "Untuk mendapatkan poin bonus di sistem sekolah",
    ],
    correctIndex: 1,
    explanation: "Melaporkan email yang mencurigakan membantu sistem keamanan mengidentifikasi dan memblokir upaya phishing serupa, melindungi semua orang — bukan hanya Anda.",
  },

  bedroom_delete: {
    question: "Alamat pengirim adalah 'admin@school-notice.net'. Apa yang mencurigakan tentang hal ini?",
    options: [
      "Ini menggunakan domain gratis, bukan domain resmi sekolah",
      "Ini memiliki terlalu banyak karakter",
      "Itu berisi kata 'admin'",
      "Tidak ada — itu terlihat sepenuhnya sah",
    ],
    correctIndex: 0,
    explanation: "Email sekolah yang sah menggunakan domain resmi seperti '@school.edu'. Domain gratis atau tidak dikenal seperti 'school-notice.net' adalah tanda bahaya untuk phishing.",
  },

  // ─── CAFE SCENARIO QUESTIONS (LAPTOP) ──────────────────────────
  cafe_evil_twin: {
    question: "Kamu terhubung ke jaringan terbuka dengan nama yang sama dengan WiFi kafe. Lalu lintas kamu disadap. Serangan apa ini, dan apa red flag yang kamu lewatkan?",
    options: [
      "Serangan DDoS — red flag-nya adalah koneksi yang lambat",
      "Serangan Evil Twin — red flag-nya adalah jaringan terbuka (tanpa password) dengan SSID yang sama seperti kafe",
      "Serangan Bluetooth spoofing — red flag-nya adalah perangkat yang meminta untuk berpasangan",
      "Serangan phishing — red flag-nya adalah email mencurigakan yang kamu terima",
    ],
    correctIndex: 1,
    explanation: "Serangan Evil Twin adalah ketika penyerang membuat titik akses WiFi palsu dengan SSID yang sama dengan jaringan terpercaya. Red flag yang paling jelas: WiFi asli kafe dilindungi dengan password, tetapi yang ini terbuka. Penyerang menggunakan ini untuk menyadap semua lalu lintas, mencuri kredensial, dan menyuntikkan konten berbahaya. Selalu konfirmasi nama jaringan yang benar dan jenis keamanannya dengan staf kafe.",
  },

  cafe_safe_choice: {
    question: "Kamu menemukan dua jaringan bernama 'CafeCorner' — satu terkunci, satu terbuka. Kamu memilih yang terkunci. Mengapa jaringan terbuka itu berbahaya?",
    options: [
      "Jaringan terbuka lebih lambat dan menguras baterai perangkat kamu",
      "Jaringan terbuka menyiarkan MAC address kamu secara publik",
      "Jaringan terbuka dengan nama yang sama seperti hotspot terpercaya adalah serangan Evil Twin klasik — tanpa password berarti siapa pun, termasuk penyerang, bisa menyadap lalu lintas kamu",
      "Jaringan terbuka hanya berbahaya jika kamu mengunjungi situs HTTP",
    ],
    correctIndex: 2,
    explanation: "Keputusan yang bagus. Ketika dua jaringan berbagi SSID yang sama tetapi salah satunya tidak memiliki password, yang terbuka itu hampir pasti titik akses palsu (Evil Twin). Bisnis yang sah menggunakan password untuk mengontrol akses. Dengan memilih jaringan yang aman, kamu menghindari penyadapan lalu lintas kamu. Selalu verifikasikan jaringan yang benar dengan staf.",
  },

  // ─── CLASSROOM SCENARIO QUESTIONS ──────────────────────────────
  classroom_teacher_confirmed: {
    question: "Apa tindakan paling penting yang harus diambil oleh guru/administrator ketika mengetahui akun mereka telah dikompromikan?",
    options: [
      "Mengubah password melalui komputer yang sama untuk menghindari downtime",
      "Menghapus email mencurigakan dan melanjutkan seperti biasa",
      "Segera mengubah password dari perangkat yang aman, menginformasikan keamanan IT, dan memeriksa akun untuk aktivitas mencurigakan",
      "Menunggu beberapa hari untuk melihat apakah serangan berlanjut sebelum melaporkan",
    ],
    correctIndex: 2,
    explanation: "Tindakan cepat dan tepat sangat penting. Mengubah password dari perangkat yang aman, menginformasikan tim keamanan, dan memeriksa akun memastikan akses tidak sah ditutup dan ancaman dapat diselidiki. Penundaan memberi penyerang lebih banyak waktu untuk menyebabkan kerusakan.",
  },
}

/**
 * Get a specific question by ID
 * @param {string} questionId - The question identifier (e.g., 'bedroom_report', 'cafe_evil_twin')
 * @returns {Object|null} - The question object or null if not found
 */
export function getQuestionById(questionId) {
  return feedbackQuestions[questionId] || null
}

/**
 * Get all available questions
 * @returns {Object} - All questions grouped by scenario
 */
export function getAllQuestions() {
  return feedbackQuestions
}

/**
 * Get questions for a specific scenario
 * @param {string} scenario - The scenario name (e.g., 'bedroom', 'cafe', 'classroom')
 * @returns {Object} - Questions for that scenario
 */
export function getQuestionsByScenario(scenario) {
  const results = {}
  Object.entries(feedbackQuestions).forEach(([key, question]) => {
    if (key.startsWith(scenario + '_')) {
      results[key] = question
    }
  })
  return results
}
