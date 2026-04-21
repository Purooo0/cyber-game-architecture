# TECHNICAL_PROJECT_OVERVIEW — Cyber Edu Game (Gamified Cybersecurity Learning Web App)

> Dokumen ini berisi penjelasan teknis lengkap (berbasis kode yang ada di repository) tentang arsitektur, komponen, alur data, dan modul utama project **Cyber Edu Game**.
>
> Target penggunaan: menjadi *single source of truth* agar LLM (mis. Claude) bisa menyusun Bab 1–3 skripsi (latar belakang, rumusan masalah, tujuan, batasan, dan tinjauan/landasan teori + deskripsi sistem) dengan konteks teknis yang akurat.

---

## 1) Ringkasan Sistem

**Nama sistem**: Cyber Edu Game (media pembelajaran keamanan siber berbasis web)

**Tujuan sistem**:
- Menyediakan pengalaman belajar keamanan siber melalui *interactive gamification*.
- Mengemas materi menjadi skenario/misi interaktif (mis. phishing dan keamanan Wi‑Fi), disertai kuis umpan balik.
- Memberikan *reward loop* berupa skor, XP, level, badge, leaderboard, serta umpan balik hasil.

**Platform**:
- Aplikasi web (frontend) dengan game engine (Phaser) + UI React.
- Backend Node.js/Express untuk otentikasi, game session, scoring, dan analytics.

---

## 2) Struktur Repo & Monorepo

Repo menggunakan **npm workspaces** (monorepo) pada folder `cyber-game-architecture/`.

### Root
File penting:
- `cyber-game-architecture/package.json`
  - Mendefinisikan workspaces:
    - `packages/game-client`
    - `packages/game-server`
  - Script utama:
    - `npm run dev` → dev server frontend
    - `npm run server` → dev backend
    - `npm run dev:all` → jalankan semuanya (workspaces)
    - `npm run build`, `npm run preview`, `npm run type-check`, `npm run lint`

### packages/game-client (Frontend + Phaser)
- Teknologi: React + TypeScript + Vite + Tailwind/Radix UI + Phaser 3.
- Berisi:
  - UI pages (landing, login, dashboard, scenario pages)
  - Phaser engine (scene, npc, map loader)
  - Overlay mobile D‑pad
  - Asset publik (Tiled map `.tmj`, sprites, audio)

### packages/game-server (Backend API)
- Teknologi: Node.js (ESM) + Express + Firebase Admin SDK + JWT.
- Fungsi:
  - Auth (login/register)
  - User profile & stats
  - Game session + scoring
  - Admin analytics (runs + feedback answers)

### packages/shared
- Paket *shared* (types/constants/utils) yang bisa dipakai lintas module.
- Saat ini didominasi dokumentasi tipe dan constants.

---

## 3) Teknologi & Library Utama

### Frontend (game-client)
- **React**: UI page dan state untuk misi/overlay/HUD.
- **TypeScript**: type safety.
- **Vite**: bundler + dev server.
- **Tailwind CSS** + komponen UI:
  - `@radix-ui/*`
  - komponen internal `src/components/ui/*` (Button, Card, Badge, Progress)
- **Phaser 3**: engine game untuk map, player movement, collision, NPC, input.
- **Tiled**: authoring peta (tilemap) dalam `.tmj` yang disimpan di `public/`.

### Backend (game-server)
- **Express**: REST API.
- **firebase-admin**: akses Firebase Realtime Database (RTDB) untuk user data, scenario data, analytics.
- **jsonwebtoken**: JWT untuk auth.
- **uuid**: pembuatan ID.
- **dotenv**: konfigurasi environment.

---

## 4) Deployment & Konfigurasi Build

### Frontend deployment (Vercel)
- File: `packages/game-client/vercel.json`
  - static build (`@vercel/static-build`)
  - output dir: `dist`
  - routing: fallback ke `/index.html` (SPA)
  - allow serving assets: `.tmj`, gambar, audio, dll.

### Backend deployment (Vercel)
- File: `packages/game-server/vercel.json`
  - menggunakan `@vercel/node`
  - route `/api/*` diarahkan ke handler express (`src/app.js`)

### Environment variables backend
- Lihat template: `packages/game-server/.env.example`
- Variabel penting:
  - `PORT`
  - `CLIENT_URL` (CORS)
  - `JWT_SECRET`
  - Firebase creds:
    - `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, dst
    - atau `FIREBASE_KEY_PATH`
  - `FIREBASE_DATABASE_URL`

Catatan penting:
- `packages/game-server/src/config/firebase.js` berisi mekanisme *serverless safety* agar function tidak crash saat env belum lengkap.

---

## 5) Backend — Arsitektur & Modul

### 5.1 Entry point
- `packages/game-server/src/server.js`
  - memanggil `initializeDatabase()` lalu start server.
- `packages/game-server/src/app.js`
  - setup express middleware:
    - `cors()`
    - `express.json()`
  - routes:
    - `/api/auth` → `authRoutes`
    - `/api/user` → `userRoutes`
    - `/api/game` → `gameRoutes`
    - `/api/leaderboard` → `leaderboardRoutes`
  - endpoint health: `/api/health`

### 5.2 Auth & Admin gating
- Middleware: `packages/game-server/src/middleware/auth.js`
  - `authenticate`:
    - ambil token dari `Authorization: Bearer <token>`
    - decode payload JWT untuk mengambil `userId` (tanpa verifikasi signature penuh — sesuai implementasi saat ini)
    - set `req.userId`
  - `requireAdmin`:
    - allowlist email admin: `admin26@gmail.com`
    - baca data user dari Firebase `users/<userId>` lalu cek `user.email`

### 5.3 Game endpoints
Routes: `packages/game-server/src/routes/gameRoutes.js`
- Public:
  - `GET /api/game/questions` → mengambil bank pertanyaan feedback (tanpa auth)
- Auth required:
  - `POST /api/game/start` → mulai session
  - `POST /api/game/action` → log action
  - `POST /api/game/feedback` → log jawaban feedback
  - `POST /api/game/finish` → selesaikan mission dan award score/xp
  - `GET /api/game/:scenarioId` → fetch scenario (route ini memakai authenticate pada repo saat ini)
- Admin-only:
  - `GET /api/game/admin/analytics` → aggregated admin metrics
  - `GET /api/game/admin/analytics/raw?type=runs|feedbackAnswers` → raw rows
  - `POST /api/game/admin/analytics/reset` → reset analytics

### 5.4 Scoring system
- Konfigurasi skor action: `packages/game-server/src/config/actionScoring.js`
  - Contoh:
    - `reported_phishing` → +15
    - `clicked_malicious_link` → -20
    - `bonus` → +20
    - `penalty` → -20
    - dll

### 5.5 Feedback questions
- `packages/game-server/src/config/feedbackQuestions.js`
  - Menyimpan teks pertanyaan, opsi jawaban, correct index, dan explanation.
  - Digunakan oleh frontend untuk menampilkan kuis setelah event tertentu.

### 5.6 Scenario content
- Folder: `packages/game-server/src/data/scenarios/*`
  - `scenario1.js` → phishing / social engineering
  - `scenario2.js` → WiFi security (evil twin)
  - `scenario3.js` → social challenge (tersedia tapi bisa difilter di client)
- Service: `packages/game-server/src/services/scenarioService.js`
  - `getScenarioById` menormalisasi akses scenario dari map di memori.

### 5.7 Database initialization
- `packages/game-server/src/services/dbInitializer.js`
  - `initializeScenariosInDB()`:
    - memastikan scenario tersimpan di Firebase RTDB `scenarios/<scenarioId>`.
  - `initializeDefaultUsers()`:
    - (opsional) membuat test users jika `INIT_TEST_USERS=true`.

### 5.8 Analytics / admin metrics
- Di controller game saat ini, analytics disimpan ke Firebase RTDB:
  - `analytics/runs` (saat finish game)
  - `analytics/feedbackAnswers` (saat log feedback)

Implementasi (lihat `packages/game-server/src/controllers/gameController.js`):
- Saat `finishGame` → push object run:
  - `runId`, `userId`, `scenarioId`, `sessionId`, `endingId`, `isSuccess`, `sessionScore`, `scoreAwarded`, `xpAwarded`, `startedAt`, `completedAt`, `durationMs`
- Saat `logFeedbackAnswer` → push object feedback:
  - `answerId`, `userId`, `scenarioId`, `sessionId`, `actionType`, `questionType`, `questionText`, `selectedIndex`, `selectedOption`, `isCorrect`, `timestamp`

Reset analytics:
- Endpoint admin menghapus node:
  - `analytics/runs`
  - `analytics/feedbackAnswers`

---

## 6) Frontend — Arsitektur & Modul

### 6.1 Entry / routing sederhana
- Entry: `packages/game-client/src/main.tsx` (Vite)
- Root component: `packages/game-client/src/App.tsx`
  - Mengelola state halaman sederhana (bukan Next Router). `PageName` mencakup:
    - `landing`, `login`, `register`, `dashboard`, `simulation`, `leaderboard`, `settings`, `bedroom`, `admin-feedback`
  - Admin page (`AdminFeedbackPage`) hanya tampil jika user authenticated dan email admin.

### 6.2 API base URL
- `packages/game-client/src/lib/api` mengandung `API_URL` dan helper fetch (mis. `safeJson`).
- Vite dev proxy mengarah `/api` ke backend local:
  - `packages/game-client/vite.config.ts` proxy: `target: http://localhost:3000`

### 6.3 Pages utama
- Landing/Login/Register: UI auth flow.
- `DashboardPage.tsx`:
  - menampilkan stats user, badges, mission list.
  - tombol admin menuju `AdminFeedbackPage` (khusus admin).
- `SimulationPage.tsx`:
  - Mission 1: skenario phishing (email/phone), mentor dialog, scoring.
  - memuat `PhaserGameContainer` untuk map-based exploration + triggers.
- `CafeScenarioPage.tsx`:
  - Mission 2: WiFi security (evil twin) + laptop/portal simulation + feedback quiz.
  - memuat `PhaserGameContainer` untuk cafe map.
- `AdminFeedbackPage.tsx`:
  - admin metrics dashboard:
    - raw feedback answer table
    - aggregated analytics
    - export CSV
    - tombol reset analytics

### 6.4 UI simulasi perangkat
- `phone-popup.tsx`:
  - menampilkan UI smartphone (email view, phishing form, feedback quiz untuk report/delete).
- `laptop-popup.tsx`:
  - menampilkan UI laptop/OS untuk scenario WiFi (WiFi picker, captive portal, browser loading, dsb).

---

## 7) Game Engine (Phaser) — Struktur & Alur

### 7.1 Komponen inti Phaser
- Scene utama: `packages/game-client/src/game/PhaserGameScene.ts` (class `GameScene`)
  - memuat tilemap dari `.tmj`
  - setup layers
  - setup collision boxes
  - create player
  - create NPC (untuk classroom/cafe)
  - input handling (keyboard, pointer/tap)
  - physics collision & overlap

- NPC class: `packages/game-client/src/game/NPC.ts`
  - turunan `Phaser.Physics.Arcade.Sprite`
  - create idle animation dari frames, `dialogueId`, `isInteractable`

- Map loader: `packages/game-client/src/services/mapLoader` + tileset loader:
  - `loadAndEmbedTilesets` dan `loadTilesetImagesIntoPhaserScene`
  - menangani tileset external menjadi embedded

- Object layer handler: `packages/game-client/src/services/objectLayerHandler`
  - extract collision boxes, trigger boxes, interactive objects dari object layers di Tiled.

- Types: `packages/game-client/src/game/types`
  - `TriggerBox`, `InteractiveObject`, `Player`, dll.

### 7.2 Data map (Tiled)
Disimpan di `packages/game-client/public/`:
- `bedroom_map.tmj`
- `classroom_map.tmj`
- `cafe_map.tmj`

Map berisi beberapa layer penting (konsep umum):
- Tile layers untuk background/decoration.
- Object layers untuk:
  - collision boxes (`CollisionBox`)
  - triggers (`TriggerBox`) → memicu event di React
  - interactives (`InteractiveObject`) → klik/interact untuk membuka dialog/aksi

### 7.3 Mekanisme trigger & interaction bridging
- Phaser scene menerima callback dari React:
  - `onTrigger?: (trigger: TriggerBox) => void`
  - `onInteract?: (interactive: InteractiveObject) => void`

- Di React pages, callback memetakan trigger/interact ke:
  - membuka PhonePopup/LaptopPopup
  - update state misi
  - memanggil API backend (start/action/finish/feedback)

### 7.4 Mobile controls
- Komponen UI: `packages/game-client/src/components/MobileDPad.tsx`
  - menghasilkan state `up/down/left/right`.
- Hook engine: `packages/game-client/src/game/usePhaserGameEngine.ts`
  - menyalurkan virtual keys ke scene via `scene.setVirtualKeys(keys)`.

### 7.5 Skoring & session lifecycle (konsep end-to-end)
1) User start mission di Dashboard.
2) Frontend memanggil `POST /api/game/start` → mendapat `sessionId`.
3) Selama mission:
   - Frontend memanggil `POST /api/game/action` untuk action scoring.
   - Frontend memanggil `POST /api/game/feedback` saat user menjawab feedback quiz.
4) Saat ending:
   - Frontend memanggil `POST /api/game/finish` dengan `endingId`.
   - Backend menghitung scoreToAward/xpToAward, update user stats, award badge, log analytics.
5) UI menampilkan hasil (success/fail) + score/xp.

---

## 8) Data Model (Implementasi yang digunakan di sistem)

> Catatan: project memakai kombinasi **Mongo-like session model** (GameSession model) di sisi server code dan **Firebase RTDB** untuk user/scenario/analytics. Dokumen ini menjelaskan struktur data yang benar-benar dipakai di alur runtime.

### 8.1 Firebase RTDB nodes utama
- `users/<userId>`
  - `email`, `username`, `passwordHash`, dll
  - `totalScore`, `level`, `currentXP`, `xpToNextLevel`
  - `badges` (array)
  - `completedScenarios` (array)
  - `settings` (audio/gameplay/security)
  - (opsional) `completedEndings` untuk tracking ending

- `scenarios/<scenarioId>`
  - data scenario (scenes, transitions) dari `data/scenarios/*`

- `analytics/runs/<pushId>`
- `analytics/feedbackAnswers/<pushId>`

### 8.2 GameSession (server model)
- `packages/game-server/src/models/GameSession.js`
  - menyimpan:
    - `userId`, `scenarioId`
    - `score`
    - `actions` (log action)
    - `feedbackAnswers`
    - `startedAt`, `completedAt`

---

## 9) Keamanan (yang ada di implementasi)

- Auth via JWT token di header `Authorization`.
- Admin gating via allowlist email admin.
- CORS di backend via middleware `cors()`.

Catatan implementasi saat ini:
- Middleware `authenticate` men-decode token payload untuk `userId`. Pada sistem produksi ideal, signature JWT diverifikasi menggunakan `JWT_SECRET`.

---

## 10) Cara Menjalankan (Developer Workflow)

### 10.1 Menjalankan dev frontend
Di root `cyber-game-architecture/`:
- `npm run dev`
  - menjalankan Vite di `localhost:5173`.
  - proxy `/api` ke backend `localhost:3000`.

### 10.2 Menjalankan backend
- `npm run server`

Backend butuh `.env` (lihat `.env.example`).

---

## 11) Admin Metrics (Statistik) — Yang Ditampilkan

Di `AdminFeedbackPage.tsx`, UI mengambil 2 jenis data:
1) Raw feedback answers:
- `GET /api/game/admin/analytics/raw?type=feedbackAnswers`

2) Aggregated analytics:
- `GET /api/game/admin/analytics`

Fitur admin:
- Filter berdasarkan scenario/action/user.
- Export CSV untuk raw feedback dan runs.
- Reset analytics:
  - `POST /api/game/admin/analytics/reset` (admin only)

---

## 12) Daftar File Penting (Index Teknis)

### Frontend
- `packages/game-client/src/App.tsx` — routing sederhana antar halaman
- `packages/game-client/src/components/pages/DashboardPage.tsx`
- `packages/game-client/src/components/pages/SimulationPage.tsx` (Mission 1)
- `packages/game-client/src/components/pages/CafeScenarioPage.tsx` (Mission 2)
- `packages/game-client/src/components/pages/AdminFeedbackPage.tsx` (admin metrics + reset)
- `packages/game-client/src/components/phone-popup.tsx`
- `packages/game-client/src/components/laptop-popup.tsx`
- `packages/game-client/src/components/MobileDPad.tsx`
- `packages/game-client/src/game/usePhaserGameEngine.ts`
- `packages/game-client/src/game/PhaserGameScene.ts`
- `packages/game-client/src/game/NPC.ts`
- `packages/game-client/src/services/mapLoader.ts`
- `packages/game-client/src/services/objectLayerHandler.ts`
- `packages/game-client/src/services/tilesetLoader.ts`

### Backend
- `packages/game-server/src/app.js` — express app + routing
- `packages/game-server/src/server.js` — start server
- `packages/game-server/src/routes/gameRoutes.js`
- `packages/game-server/src/controllers/gameController.js`
- `packages/game-server/src/middleware/auth.js`
- `packages/game-server/src/config/firebase.js`
- `packages/game-server/src/config/actionScoring.js`
- `packages/game-server/src/config/feedbackQuestions.js`
- `packages/game-server/src/services/dbInitializer.js`
- `packages/game-server/src/data/scenarios/*`

---

## 13) Catatan untuk Penyusunan Bab Skripsi (untuk Claude)

Jika Claude perlu menyusun Bab 1–3, konteks teknis yang bisa diangkat dari sistem ini meliputi:
- Gamifikasi: score, XP, level, badge, leaderboard, feedback quiz.
- Simulasi ancaman: phishing email (HP), evil twin Wi‑Fi (laptop portal).
- Interaksi berbasis skenario: engine Phaser + map Tiled + trigger/interact.
- Backend REST API untuk session, scoring, dan analytics.
- Admin dashboard untuk evaluasi data interaksi (runs + feedback correctness).

---

## 14) Batasan Dokumen

Dokumen ini bersumber dari:
- struktur repo
- kode frontend dan backend
- konfigurasi vercel/env/example

Jika ada perubahan manual lokal yang belum di-commit, dokumen ini tidak otomatis mencakupnya.

---

## 15) Checklist Validasi (Quick)

- [ ] Frontend bisa build dan load halaman (Vite/Vercel)
- [ ] Backend `/api/health` ok
- [ ] Login/register menghasilkan token
- [ ] Start mission memanggil `/api/game/start`
- [ ] Finish mission memanggil `/api/game/finish` dan mengupdate `users/<id>`
- [ ] Admin page bisa fetch `/api/game/admin/analytics` dan raw
- [ ] Reset analytics menghapus `analytics/runs` dan `analytics/feedbackAnswers`

