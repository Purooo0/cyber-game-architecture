export const scenario3 = {
  id: "social-challenge",
  title: "Challenge Seru di Media Sosial",
  topic: "Social Engineering melalui Oversharing & Data Collection",
  level: "Medium",
  
  // ✅ Badge yang diberikan saat menyelesaikan mission
  badge: {
    id: 'privacy-guardian',
    name: 'Privacy Guardian',
    icon: '🔒',
    description: 'Berhasil melindungi data pribadi dari pengumpulan data di media sosial'
  },

  scenes: [
    // ======================
    // INTRO SCENE
    // ======================
    {
      sceneId: "intro",
      description: "Kamu membuka Instagram/TikTok setelah pelajaran. Banyak teman memulai 'challenge' baru.",
      validActions: ["OPEN_INSTAGRAM"],
      transitions: {
        OPEN_INSTAGRAM: "scene-1",
      },
    },

    // ======================
    // SCENE 1 – CHALLENGE VIRAL
    // ======================
    {
      sceneId: "scene-1",
      description: "Narasi: 'Kamu membuka Instagram setelah pelajang sekolah. Banyak teman memulai challenge baru'",
      validActions: ["JOIN_CHALLENGE", "IGNORE_CHALLENGE"],
      transitions: {
        JOIN_CHALLENGE: "jawab-challenge",
        IGNORE_CHALLENGE: "good-ending",
      },
    },

    // ======================
    // SCENE 2A – JAWAB CHALLENGE
    // ======================
    {
      sceneId: "jawab-challenge",
      description: "Teks Challenge: 'CHALLENGE SERU! Jawab 5 pertanyaan di bawah ini dan tag 10 teman kamu!' Pertanyaan: 1. Nama bibi pertamamu? 2. Kota kelahiran? 3. Tanggal ulang tahun? 4. Nama panggilan kecil? 5. Nama sekolah SD?",
      validActions: ["JAWAB_SEMUA", "JAWAB_SEBAGIAN"],
      transitions: {
        JAWAB_SEMUA: "bad-ending",
        JAWAB_SEBAGIAN: "scene-2",
      },
    },

    // ======================
    // SCENE 2 – DATA TERKUMPUL
    // ======================
    {
      sceneId: "scene-2",
      description: "Data Terkumpul: Narasi: 'Beberapa hari kemudian, kamu menerima notifikasi reset password dari akun emailmu.'",
      validActions: ["AKSES_EMAIL", "BIARKAN_RESET"],
      transitions: {
        AKSES_EMAIL: "reset-password",
        BIARKAN_RESET: "bad-ending",
      },
    },

    // ======================
    // SCENE 3 – AKUN DIAMBIL ALIH
    // ======================
    {
      sceneId: "akun-diambil-alih",
      description: "Akun Diambil Alih: Narasi: 'Akun mu berhasil diambil alih! menggunakan Fitur Lupa Password.' Pertanyaan keamanan: 1. Nama bibi pertamamu? 2. Kota kelahiran? 3. Tanggal ulang tahun? 4. Nama panggilan kecil? 5. Nama sekolah SD?",
      validActions: ["RESTART"],
      transitions: {
        RESTART: "bad-ending",
      },
    },

    // ======================
    // SCENE 3 – VERIFIKASI RESET
    // ======================
    {
      sceneId: "reset-password",
      description: "Sistem meminta verifikasi untuk reset password. Pertanyaan keamanan: 'Nama bibi pertamamu?'",
      validActions: ["JAWAB_BENAR", "JAWAB_SALAH"],
      transitions: {
        JAWAB_BENAR: "akun-diambil-alih",
        JAWAB_SALAH: "good-ending",
      },
    },

    // ======================
    // GOOD ENDING
    // ======================
    {
      sceneId: "good-ending",
      description: "Akun aman! Kamu memahami bahaya oversharing di media sosial dan selalu waspada terhadap challenge yang mencurigakan.",
      validActions: ["RESTART"],
      transitions: {
        RESTART: null,
      },
    },

    // ======================
    // BAD ENDING
    // ======================
    {
      sceneId: "bad-ending",
      description: "Akun mu diambil alih! DM mu mengirim uang - DP dikrim mentega uang - Foto pribadi tersebar",
      validActions: ["RESTART"],
      transitions: {
        RESTART: null,
      },
    },
  ],
};
