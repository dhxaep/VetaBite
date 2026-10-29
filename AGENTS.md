# AGENTS.md — Master Execution Protocol & Rules untuk AI Coding Agent

> **Tujuan Dokumen:**  
> Dokumen ini adalah aturan kerja absolut (guardrail & instruction) untuk AI coding agent (Claude Code, Cursor, Antigravity, GitHub Copilot, Codex, dll) yang membangun sistem **VetaBite** (Platform Pemesanan Kantin UPN Veteran Jakarta).  
> **IKUTI SEMUA ATURAN DI BAWAH INI TANPA PENYIMPANGAN.**

---

## 1. Aturan Anti-Bengong & Protokol Eksekusi AI (ANTI-FREEZE PROTOCOL)

Agar AI tidak berhenti di tengah jalan ("bengong") atau melakukan kesalahan ("salah implementasi"):

1. **Wajib Baca Sesuai Urutan (Single Source of Truth):**
   1. `AGENTS.md` (Aturan ini)
   2. `docs/01-PRD-DAN-ALUR.md` (Logika bisnis, role, state machine)
   3. `docs/02-DESIGN-SYSTEM-STITCH.md` (Design tokens & styling Liquid Glass)
   4. `docs/03-ARSITEKTUR-DAN-DATABASE.md` (Struktur folder & Prisma schema)
   5. `docs/04-API-DAN-REALTIME-SPEC.md` (Kontrak API & payload)
   6. `docs/05-STITCH-SCREEN-SPEC.md` (Spesifikasi ke-18 layar Stitch)
   7. `docs/06-TASKS-PER-PIC.md` (Backlog pengerjaan task demi task)

2. **Dilarang Menebak Desain UI / Mengarang Styling Sendiri:**
   - Semua desain UI **SUDAH JADI** dan tersedia di folder `stitch-references/` (18 layar hasil Stitch).
   - Sebelum membuat/mengedit komponen halaman, AI **WAJIB membuka dan membaca file `code.html`** yang sesuai di `stitch-references/` (lihat pemetaan di `docs/05-STITCH-SCREEN-SPEC.md`).
   - Salin dan konversikan struktur HTML & classes Tailwind persis seperti yang ada di `code.html`. Jangan berimprovisasi mengganti layout atau palet warna!

3. **Prinsip Pengerjaan Atomik (One Task at a Time):**
   - Ambil **SATU** task dari `docs/06-TASKS-PER-PIC.md`.
   - Implementasikan file yang dibutuhkan (page, component, API route, server action).
   - Pastikan TypeScript tidak ada error (`strict: true`), tidak ada missing imports.
   - Tandai checkbox task yang selesai `[x]`, lalu lanjutkan ke task berikutnya secara sistematis. Jangan melompati fase!

4. **Kemandirian & Penyelesaian Masalah:**
   - Jika membutuhkan komponen baru, cek apakah sudah ada padanannya di `components/ui/`.
   - Jika API route belum ada, buat endpoint mock atau sesuaikan dengan `docs/04-API-DAN-REALTIME-SPEC.md`.
   - Jangan pernah berhenti dan meminta konfirmasi hal-hal sepele yang sudah tertulis di dokumen spesifikasi.

---

## 2. Aturan Wajib Proyek (Strict Guardrails)

### A. Estetika & Desain (Zero Emoji Rule)
1. **Dilarang Menggunakan Emoji di Manapun!**
   - Jangan pernah gunakan emoji seperti 🍔, 🛒, ⭐, ✅, ❌, dll pada teks UI, placeholder, copywriter, notifikasi, maupun nama komponen.
   - **Gunakan SVG Icon** (Lucide React atau inline SVG dengan stroke 1.75px/2px rounded).
2. **Bahasa UI Default:**
   - Seluruh teks antarmuka (copywriter, placeholder, pesan error, label tombol) menggunakan **Bahasa Indonesia** yang ramah dan formal kampus.
   - Siapkan struktur i18n (`messages/id.json` dan `messages/en.json`).
3. **Liquid Glass & Dual Theme:**
   - Wajib mendukung **Light Mode** (Warm Cream `#F6EFEA`) dan **Dark Mode** (Deep Espresso `#1A1210`).
   - Gunakan CSS variables dari `docs/02-DESIGN-SYSTEM-STITCH.md`. Jangan hardcode hex warna secara sembarangan di komponen.

### B. Keamanan & Validasi Server
1. **Validasi Wajib di Server:**
   - Validasi sisi klien hanya untuk kenyamanan pengguna; validasi sisi server (Route Handler / Server Action) adalah penentu mutlak.
   - **Upload Bukti Bayar:** Maksimum 5 MB, wajib memeriksa MIME asli file (`image/jpeg`, `image/png`, `image/webp`), bukan hanya ekstensi nama file. File disimpan dengan nama UUID/hash acak di storage.
   - **Gate Checkout:** Pesanan TIDAK BISA diproses tanpa bukti bayar valid.
   - **Stok Habis:** Menu dengan status `Habis` (`is_available: false`) wajib ditolak oleh server jika dimasukkan dalam pesanan checkout.
   - **Banned User:** User yang ada dalam daftar blacklist loket (`canteen_bans`) ditolak otomatis oleh server saat mencoba checkout di loket tersebut.
2. **Autentikasi & RBAC:**
   - Password di-hash menggunakan `argon2` atau `bcrypt`.
   - Session aman berbasis cookie httpOnly.
   - Middleware membatasi akses:
     * Mahasiswa tidak boleh mengakses area `/seller/*` atau `/admin/*`.
     * Penjual hanya boleh mengakses dan mengubah data loket miliknya sendiri (`canteen.owner_id = session.userId`).
     * Admin hanya mengelola kantin (`/admin/*`) dan **TIDAK MENGELOLA** akun mahasiswa.

### C. Integritas Data & Transaksi
1. **Harga & Mata Uang:**
   - Disimpan di database sebagai integer Rupiah (misal: `15000` untuk Rp 15.000).
   - Format tampilan wajib berstandar Indonesia: `Rp 15.000` (menggunakan helper `formatRupiah()`).
2. **Snapshot Riwayat Pesanan (`order_items`):**
   - Wajib menyimpan `name_snapshot` dan `price_snapshot` saat pesanan dibuat. Perubahan harga/nama menu di masa depan tidak boleh mengubah data riwayat transaksi lama.
3. **Nomor Antrean Harian:**
   - Dibuat dengan format prefix loket + counter 3 digit (misal `A-001`), dan di-reset setiap hari untuk tiap loket.

### D. Real-Time Tanpa Reload
1. **Server-Sent Events (SSE):**
   - Perubahan status pesanan (`ANTRIAN` -> `MASAK` -> `SIAP_AMBIL`) harus otomatis memperbarui layar pelacakan mahasiswa tanpa perlu reload browser.
   - Pesanan baru yang masuk harus otomatis muncul di layar penjual secara real-time.
   - Perubahan status buka/tutup toko dan stok menu harus tersinkronisasi ke pembeli.

---

## 3. Definition of Done (DoD) Setiap Halaman / Task

Sebuah task baru dianggap selesai `[x]` apabila memenuhi seluruh kriteria ini:
- [ ] **Sesuai Referensi Stitch:** Layout, warna, dan komponen cocok dengan `code.html` terkait di `stitch-references/`.
- [ ] **Responsif:** Tampilan sempurna di mobile viewport (390px - 430px), tablet (768px), dan desktop (1280px - 1440px).
- [ ] **Light & Dark Mode:** Terlihat kontras, elegan, dan specular rim highlight terbaca jelas di kedua mode.
- [ ] **4 State Utama:** 
  1. *Normal State* (tampilan data ideal)
  2. *Loading State* (skeleton loading dengan efek shimmer glass, bukan spinner kosong)
  3. *Empty State* (ilustrasi SVG + pesan ramah bahasa Indonesia saat data kosong)
  4. *Error State* (pesan error informatif + tombol aksi retry)
- [ ] **Strict Typing:** Tidak ada penggunaan `any` tanpa alasan jelas di TypeScript.
- [ ] **Role Guard:** Halaman terlindungi oleh middleware otorisasi.
