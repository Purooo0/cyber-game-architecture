# Panduan Scene Mission 1 & Mission 2 (dengan Feedback Questions)

Dokumen ini menjelaskan runtutan **scene** (alur cerita/transition) pada:
- **Mission 1** — *Pengumuman Darurat dari Sekolah* (Topik: Phishing / Social Engineering)
- **Mission 2** — *Wi‑Fi Gratis di Kafe Dekat Sekolah* (Topik: Evil Twin Wi‑Fi / MITM)

Sumber data utama:
- Mission 1: `packages/game-server/src/data/scenarios/scenario1.js`
- Mission 2: `packages/game-server/src/data/scenarios/scenario2.js`
- Feedback questions: `packages/game-server/src/config/feedbackQuestions.js`

> Catatan:
> - Di sisi client, Mission 1 menggunakan map `bedroom_map.tmj` lalu transisi ke `classroom_map.tmj`.
> - Mission 2 menggunakan map `cafe_map.tmj`.
> - Nama **scene** di bawah mengikuti definisi `sceneId` pada file scenario.

---

## Mission 1 — Pengumuman Darurat dari Sekolah (Phishing)

**Scenario ID (server):** `emergency-school`

**Badge:**
- ID: `phishing-detective`
- Nama: Phishing Detective
- Ikon: 🛡️
- Deskripsi: Berhasil mendeteksi dan menghindari serangan phishing email

### Ringkasan Pembelajaran
Target kompetensi yang dilatih:
- Mengenali indikator phishing (pengirim/domain tidak resmi, tautan mencurigakan, permintaan data sensitif).
- Merespons insiden dengan tindakan aman (lapor/hapus/abaikan, verifikasi sumber).

### Daftar Scene & Transisi

#### 1) Scene: `intro`
**Deskripsi:** Sepulang sekolah, kamu menerima notifikasi email di HP.

- **Valid actions:** `OPEN_EMAIL`
- **Transisi:**
  - `OPEN_EMAIL` → `email-view`

**Catatan implementasi (client):** biasanya terjadi saat intro/mentor selesai dan HP/popup email dibuka.

---

#### 2) Scene: `email-view`
**Deskripsi:** Email darurat dari pihak sekolah meminta verifikasi data.

- **Valid actions:**
  - `CLICK_LINK`
  - `IGNORE_EMAIL`
  - `CHECK_SENDER`

- **Transisi:**
  - `CLICK_LINK` → `phishing-form`
  - `IGNORE_EMAIL` → `good-ending`
  - `CHECK_SENDER` → `sender-check`

**Inti belajar:** sebelum klik tautan, cek pengirim dan indikasi “urgency”.

---

#### 3) Scene: `sender-check`
**Deskripsi:** Kamu menyadari email dikirim dari Gmail, bukan domain resmi sekolah.

- **Valid actions:** `REPORT_EMAIL`
- **Transisi:**
  - `REPORT_EMAIL` → `good-ending`

**Inti belajar:** domain tidak resmi adalah red flag.

**Feedback question yang relevan (opsional, bila dipanggil oleh UI):**
- ID: `bedroom_delete`
  - Pertanyaan: "Alamat pengirim adalah 'admin@school-notice.net'. Apa yang mencurigakan tentang hal ini?"
  - Jawaban benar: opsi index `0`
  - Penjelasan: domain resmi sekolah seharusnya seperti `@school.edu`; domain asing/tidak dikenal red flag.

---

#### 4) Scene: `phishing-form`
**Deskripsi:** Form online meminta data pribadi dan akun belajar.

- **Valid actions:**
  - `SUBMIT_FORM`
  - `CLOSE_PAGE`
  - `REPORT_EMAIL`

- **Transisi:**
  - `SUBMIT_FORM` → `bad-ending`
  - `CLOSE_PAGE` → `good-ending`
  - `REPORT_EMAIL` → `good-ending`

**Inti belajar:** jangan input data sensitif pada form yang tidak terverifikasi.

**Feedback question yang relevan (opsional, bila dipanggil oleh UI):**
- ID: `bedroom_report`
  - Pertanyaan: "Mengapa penting untuk melaporkan email yang mencurigakan daripada hanya mengabaikannya?"
  - Jawaban benar: opsi index `1`
  - Penjelasan: pelaporan membantu sistem memperingatkan orang lain dan memblokir ancaman serupa.

---

#### 5) Ending: `good-ending`
**Deskripsi:** Tidak terjadi masalah pada akun sekolahmu. Kamu berhasil menghindari phishing.

- `isEnding: true`

**Outcome yang diharapkan:** hasil simulasi berhasil (aman).

---

#### 6) Ending: `bad-ending`
**Deskripsi:** Beberapa hari kemudian, akun belajarmu terkunci akibat kebocoran data.

- `isEnding: true`

**Outcome yang diharapkan:** hasil simulasi gagal (terjebak phishing).

---

## Mission 2 — Wi‑Fi Gratis di Kafe Dekat Sekolah (Evil Twin Wi‑Fi)

**Scenario ID (server):** `security-wifi`

**Badge:**
- ID: `wifi-guardian`
- Nama: WiFi Guardian
- Ikon: 🔐
- Deskripsi: Berhasil mengidentifikasi dan menghindari jaringan WiFi palsu (Evil Twin)

### Ringkasan Pembelajaran
Target kompetensi yang dilatih:
- Memahami konsep **Evil Twin** (SSID sama, hotspot palsu meniru Wi‑Fi resmi).
- Praktik aman menggunakan Wi‑Fi publik (pilih jaringan terkunci/resmi, verifikasi ke staf).

### Daftar Scene & Transisi

#### 1) Scene: `intro`
**Deskripsi:** Setelah pelajaran, kamu akan mengerjakan tugas di kafe. Kamu melihat jaringan Wi‑Fi palsu.

- **Valid actions:** `OPEN_WIFI`
- **Transisi:**
  - `OPEN_WIFI` → `wifi-list`

---

#### 2) Scene: `wifi-list`
**Deskripsi:** Daftar Wi‑Fi muncul: CafeCorner, CafeCorner_free, Free_WiFi_Public

- **Valid actions:**
  - `CONNECT_LEGIT`
  - `CONNECT_EVIL`
  - `CHECK_OWNER`

- **Transisi:**
  - `CONNECT_LEGIT` → `connected-legit`
  - `CONNECT_EVIL` → `evil-wifi`
  - `CHECK_OWNER` → `owner-check`

---

#### 3) Scene: `connected-legit`
**Deskripsi:** Terhubung ke Wi‑Fi resmi kafe. Kamu bisa membuka website dengan aman.

- **Valid actions:** `OPEN_GMAIL`, `OPEN_BANK`, `CLOSE_BROWSER`
- **Transisi:**
  - `OPEN_GMAIL` → `good-ending`
  - `OPEN_BANK` → `good-ending`
  - `CLOSE_BROWSER` → `good-ending`

**Feedback question (setelah memilih Wi‑Fi aman):**
- ID: `cafe_safe_choice`
  - Pertanyaan: "Kamu menemukan dua jaringan bernama 'CafeCorner' — satu terkunci, satu terbuka. Kamu memilih yang terkunci. Mengapa jaringan terbuka itu berbahaya?"
  - Jawaban benar: opsi index `2`
  - Penjelasan: jaringan terbuka “kembar” adalah pola Evil Twin; tanpa password memudahkan penyadapan.

---

#### 4) Scene: `evil-wifi`
**Deskripsi:** Terhubung ke jaringan palsu. Hacker dapat menyadap data!

- **Valid actions:** `OPEN_GMAIL`, `OPEN_BANK`, `DISCONNECT`
- **Transisi:**
  - `OPEN_GMAIL` → `data-intercepted`
  - `OPEN_BANK` → `bad-ending`
  - `DISCONNECT` → `midway`

**Feedback question (setelah memilih Wi‑Fi palsu / Evil Twin):**
- ID: `cafe_evil_twin`
  - Pertanyaan: "Kamu terhubung ke jaringan terbuka dengan nama yang sama dengan WiFi kafe. Lalu lintas kamu disadap. Serangan apa ini, dan apa red flag yang kamu lewatkan?"
  - Jawaban benar: opsi index `1`
  - Penjelasan: Evil Twin; red flag: SSID sama tapi terbuka/tanpa password.

---

#### 5) Scene: `owner-check`
**Deskripsi:** Kamu bertanya kepada pemilik kafe tentang Wi‑Fi resmi mereka.

- **Valid actions:** `CONNECT_LEGIT`, `TAKE_SELFIE`
- **Transisi:**
  - `CONNECT_LEGIT` → `connected-legit`
  - `TAKE_SELFIE` → `photo-posted`

**Inti belajar:** verifikasi jaringan resmi ke staf.

---

#### 6) Scene: `data-intercepted`
**Deskripsi:** Email Anda berhasil diintersepsi. Beberapa hari kemudian, akun media sosial Anda diretas!

- **Valid actions:** `RESTART`
- **Transisi:**
  - `RESTART` → `bad-ending`

---

#### 7) Scene: `photo-posted`
**Deskripsi:** Foto selfie Anda dibagikan di media sosial, menunjukkan nama Wi‑Fi dan lokasi!

- **Valid actions:** `RESTART`
- **Transisi:**
  - `RESTART` → `bad-ending`

---

#### 8) Scene: `midway`
**Deskripsi:** Kamu memutuskan koneksi, tapi sudah terlambat. Data telah tercuri!

- **Valid actions:** `RESTART`
- **Transisi:**
  - `RESTART` → `bad-ending`

---

#### 9) Ending: `good-ending`
**Deskripsi:** Tidak terjadi masalah akses mencurigakan dan Gmail sempat diketahui!

- Scene ini diperlakukan sebagai ending.

---

#### 10) Ending: `bad-ending`
**Deskripsi:** Akumu digunakan untuk mengirim spam dan mencoba login ke akun lain!

- Scene ini diperlakukan sebagai ending.

---

## Lampiran — Daftar Feedback Questions yang Dipakai Mission 1 & 2

### Mission 1 (prefix: `bedroom_`)
- `bedroom_report`
- `bedroom_delete`

### Mission 2 (prefix: `cafe_`)
- `cafe_evil_twin`
- `cafe_safe_choice`

> Ada juga question terkait *classroom*:
> - `classroom_teacher_confirmed`
> Ini dipakai pada alur kelas/guru (terkait tindakan pasca kompromi akun) dan bisa muncul saat map `classroom_map.tmj` (tergantung implementasi di client).
