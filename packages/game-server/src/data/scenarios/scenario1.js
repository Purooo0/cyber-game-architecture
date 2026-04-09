export const scenario1 = {
  id: "emergency-school",
  title: "Pengumuman Darurat dari Sekolah",
  topic: "Phishing / Social Engineering",
  level: "Easy",
  
  // ✅ Badge yang diberikan saat menyelesaikan mission
  badge: {
    id: 'phishing-detective',
    name: 'Phishing Detective',
    icon: '🛡️',
    description: 'Berhasil mendeteksi dan menghindari serangan phishing email'
  },

  scenes: [
    // ======================
    // INTRO SCENE
    // ======================
    {
      sceneId: "intro",
      description: "Sepulang sekolah, kamu menerima notifikasi email di HP.",
      validActions: ["OPEN_EMAIL"],
      transitions: {
        OPEN_EMAIL: "email-view",
      },
    },

    // ======================
    // SCENE 1 – EMAIL DIBUKA
    // ======================
    {
      sceneId: "email-view",
      description: "Email darurat dari pihak sekolah meminta verifikasi data.",
      validActions: [
        "CLICK_LINK",
        "IGNORE_EMAIL",
        "CHECK_SENDER",
      ],
      transitions: {
        CLICK_LINK: "phishing-form",
        IGNORE_EMAIL: "good-ending",
        CHECK_SENDER: "sender-check",
      },
    },

    // ======================
    // SCENE 2A – FORM PALSU
    // ======================
    {
      sceneId: "phishing-form",
      description: "Form online meminta data pribadi dan akun belajar.",
      validActions: [
        "SUBMIT_FORM",
        "CLOSE_PAGE",
        "REPORT_EMAIL",
      ],
      transitions: {
        SUBMIT_FORM: "bad-ending",
        CLOSE_PAGE: "good-ending",
        REPORT_EMAIL: "good-ending",
      },
    },

    // ======================
    // SCENE 2C – CEK PENGIRIM
    // ======================
    {
      sceneId: "sender-check",
      description:
        "Kamu menyadari email dikirim dari Gmail, bukan domain resmi sekolah.",
      validActions: ["REPORT_EMAIL"],
      transitions: {
        REPORT_EMAIL: "good-ending",
      },
    },

    // ======================
    // GOOD ENDING
    // ======================
    {
      sceneId: "good-ending",
      description:
        "Tidak terjadi masalah pada akun sekolahmu. Kamu berhasil menghindari phishing.",
      isEnding: true,
    },

    // ======================
    // BAD ENDING
    // ======================
    {
      sceneId: "bad-ending",
      description:
        "Beberapa hari kemudian, akun belajarmu terkunci akibat kebocoran data.",
      isEnding: true,
    },
  ],
};