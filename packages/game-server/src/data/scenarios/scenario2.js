export const scenario2 = {
  id: "security-wifi",
  title: "Wi-Fi Gratis di Kafe Dekat Sekolah",
  topic: "Evil Twin Wi-Fi & Man-in-the-Middle Attack",
  level: "Medium",
  
  // ✅ Badge yang diberikan saat menyelesaikan mission
  badge: {
    id: 'wifi-guardian',
    name: 'WiFi Guardian',
    icon: '🔐',
    description: 'Berhasil mengidentifikasi dan menghindari jaringan WiFi palsu (Evil Twin)'
  },

  scenes: [
    // ======================
    // INTRO SCENE
    // ======================
    {
      sceneId: "intro",
      description: "Setelah pelajaran, kamu akan mengerjakan tugas di kafe. Kamu melihat jaringan Wi-Fi palsu.",
      validActions: ["OPEN_WIFI"],
      transitions: {
        OPEN_WIFI: "wifi-list",
      },
    },

    // ======================
    // SCENE 1 – LOGIN AKUN
    // ======================
    {
      sceneId: "wifi-list",
      description: "Daftar Wi-Fi muncul: CafeCorner, CafeCorner_free, Free_WiFi_Public",
      validActions: ["CONNECT_LEGIT", "CONNECT_EVIL", "CHECK_OWNER"],
      transitions: {
        CONNECT_LEGIT: "connected-legit",
        CONNECT_EVIL: "evil-wifi",
        CHECK_OWNER: "owner-check",
      },
    },

    // ======================
    // SCENE 2A – KONEKSI LEGIT
    // ======================
    {
      sceneId: "connected-legit",
      description: "Terhubung ke Wi-Fi resmi kafe. Kamu bisa membuka website dengan aman.",
      validActions: ["OPEN_GMAIL", "OPEN_BANK", "CLOSE_BROWSER"],
      transitions: {
        OPEN_GMAIL: "good-ending",
        OPEN_BANK: "good-ending",
        CLOSE_BROWSER: "good-ending",
      },
    },

    // ======================
    // SCENE 2B – EVIL TWIN WIFI
    // ======================
    {
      sceneId: "evil-wifi",
      description: "Terhubung ke jaringan palsu. Hacker dapat menyadap data!",
      validActions: ["OPEN_GMAIL", "OPEN_BANK", "DISCONNECT"],
      transitions: {
        OPEN_GMAIL: "data-intercepted",
        OPEN_BANK: "bad-ending",
        DISCONNECT: "midway",
      },
    },

    // ======================
    // SCENE 2C – CEK OWNER
    // ======================
    {
      sceneId: "owner-check",
      description: "Kamu bertanya kepada pemilik kafe tentang Wi-Fi resmi mereka.",
      validActions: ["CONNECT_LEGIT", "TAKE_SELFIE"],
      transitions: {
        CONNECT_LEGIT: "connected-legit",
        TAKE_SELFIE: "photo-posted",
      },
    },

    // ======================
    // SCENE 3 - DATA INTERCEPTED
    // ======================
    {
      sceneId: "data-intercepted",
      description: "Email Anda berhasil diintersepsi. Beberapa hari kemudian, akun media sosial Anda diretas!",
      validActions: ["RESTART"],
      transitions: {
        RESTART: "bad-ending",
      },
    },

    // ======================
    // SCENE 3 - PHOTO POSTED
    // ======================
    {
      sceneId: "photo-posted",
      description: "Foto selfie Anda dibagikan di media sosial, menunjukkan nama Wi-Fi dan lokasi!",
      validActions: ["RESTART"],
      transitions: {
        RESTART: "bad-ending",
      },
    },

    // ======================
    // SCENE 3 - MIDWAY
    // ======================
    {
      sceneId: "midway",
      description: "Kamu memutuskan koneksi, tapi sudah terlambat. Data telah tercuri!",
      validActions: ["RESTART"],
      transitions: {
        RESTART: "bad-ending",
      },
    },

    // ======================
    // GOOD ENDING
    // ======================
    {
      sceneId: "good-ending",
      description: "Tidak terjadi masalah akses mencurigakan dan Gmail sempat diketahui!",
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
      description: "Akumu digunakan untuk mengirim spam dan mencoba login ke akun lain!",
      validActions: ["RESTART"],
      transitions: {
        RESTART: null,
      },
    },
  ],
};
