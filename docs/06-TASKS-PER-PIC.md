# 06 — Backlog Tugas Bertahap per PIC (Execution Plan)

> **PANDUAN EKSEKUSI UNTUK AI & TIM DEV:**  
> Kerjakan tugas secara bertahap mulai dari **Fase 0 (Fondasi)** hingga **Fase Akhir**.  
> Setiap task memiliki rujukan langsung ke file referensi `code.html` di `stitch-references/` dan spesifikasi teknis di `docs/05-STITCH-SCREEN-SPEC.md`. Centang task yang selesai dengan mengganti `[ ]` menjadi `[x]`.

---

## 🏗️ FASE 0 — FONDASI ARSITEKTUR & DESAIN (Semua Tim / AI)

Task fondasi wajib diselesaikan sebelum masuk ke pengerjaan per PIC.

- [x] **Task 0.1: Setup Proyek Next.js & Dependensi**
  * Buat proyek Next.js 14/15 dengan App Router, TypeScript strict, dan Tailwind CSS.
  * Pasang package utama: `prisma`, `@prisma/client`, `lucide-react`, `zod`, `bcryptjs` (atau `argon2`), `recharts`.
- [x] **Task 0.2: Implementasi Token Desain & Primitives Liquid Glass**
  * Salin variabel CSS dari `docs/02-DESIGN-SYSTEM-STITCH.md` ke `src/app/globals.css`.
  * Konfigurasi `tailwind.config.ts` dengan warna dan shadow Liquid Amber Refraction.
  * Buat komponen UI dasar di `src/components/ui/`: `Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`, `Modal.tsx`, `Tabs.tsx`.
- [x] **Task 0.3: Setup Database PostgreSQL & Seeding Data**
  * Salin skema Prisma dari `docs/03-ARSITEKTUR-DAN-DATABASE.md` ke `prisma/schema.prisma`.
  * Jalankan migrasi: `npx prisma migrate dev --name init`.
  * Buat script `prisma/seed.ts` berisi: 1 akun Admin (`admin`/`Admin123!`), 3 akun Kantin (`kantin1`, `kantin2`, `kantin3`), 15 menu makanan contoh, dan 2 akun Mahasiswa (`mahasiswa1`, `mahasiswa2`).
- [x] **Task 0.4: Middleware Autentikasi & RBAC Guard**
  * Buat helper session cookie di `src/lib/auth.ts`.
  * Buat `middleware.ts` untuk memproteksi route `(mahasiswa)`, `(penjual)`, dan `(admin)`.

---

## 👤 FAIZ — MODUL AUTENTIKASI, PENCARIAN & RIWAYAT

*Fokus: Gerbang masuk aplikasi, registrasi multi-role, pencarian pintar, dan layout navigasi.*

- [x] **Task F.1: Halaman Welcome & Get Started**
  * *Referensi:* Layar 01 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_welcome_get_started/code.html`)
  * *File:* `src/app/page.tsx`
  * *Kriteria:* Tampilan landing mobile 430px, 3 value proposition pills, CTA tombol besar ke `/login`.
- [x] **Task F.2: Halaman Login & Registrasi Multi-Role**
  * *Referensi:* Layar 02 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_login_registrasi_multi_role/code.html`)
  * *File:* `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
  * *Endpoint:* `POST /api/auth/login`, `POST /api/auth/register`
  * *Kriteria:*
    - Segmented tab switch `Masuk` vs `Daftar`.
    - Pilihan role card saat daftar: `Mahasiswa` (langsung aktif) vs `Ibu Kantin` (status pending + field nama loket).
    - Redirect otomatis sesuai role hasil login.
    - Error message berbahasa Indonesia jika password salah atau akun ditolak.
- [x] **Task F.3: Halaman Menunggu Verifikasi Akun Ibu Kantin**
  * *Referensi:* Layar 03 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_status_verifikasi_akun_ibu_kantin/code.html`)
  * *File:* `src/app/(auth)/pending-verification/page.tsx`
  * *Kriteria:* Icon jam pasir SVG, ringkasan pendaftaran loket, tombol hubungi admin WhatsApp dan tombol keluar.
- [x] **Task F.4: Halaman Pencarian & Riwayat Search**
  * *Referensi:* Layar 05 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_hasil_pencarian_riwayat/code.html`)
  * *File:* `src/app/(mahasiswa)/search/page.tsx`
  * *Endpoint:* `GET /api/canteens?q=...`, `GET /api/me/search-history`, `DELETE /api/me/search-history`
  * *Kriteria:* Search bar auto-focus, tag riwayat pencarian yang bisa dihapus satu per satu atau semua, filter tab (Semua/Kantin/Menu), kartu hasil pencarian.

---

## 👤 DONISKA — DASHBOARD MAHASISWA, PROFIL & STATUS OPERASIONAL TOKO

*Fokus: Pusat navigasi mahasiswa, preferensi pengguna, dan kendali buka/tutup toko penjual.*

- [x] **Task D.1: Dashboard Utama Mahasiswa**
  * *Referensi:* Layar 04 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_dashboard_utama/code.html`)
  * *File:* `src/app/(mahasiswa)/dashboard/page.tsx`, `src/components/shared/BottomDock.tsx`
  * *Endpoint:* `GET /api/canteens`
  * *Kriteria:*
    - Greeting nama mahasiswa, promo banner UPNVJ.
    - Horizontal scroll kategori menu (`Semua`, `Makanan`, `Minuman`, `Camilan`).
    - Kartu direktori kantin (thumbnail foto, badge `Loket #01`, rating bintang SVG, status `Buka`/`Tutup`, estimasi menit saji).
    - Floating bottom navigation dock 4 ikon dengan clearance margin 92px.
- [x] **Task D.2: Halaman Profil & Pengaturan Akun (Manage Account)**
  * *Referensi:* Layar 06 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_profile_settings_manage_account/code.html`)
  * *File:* `src/app/(mahasiswa)/profil/page.tsx`
  * *Endpoint:* `GET /api/me`, `PATCH /api/me`, `POST /api/auth/logout`
  * *Kriteria:* Edit nama & upload avatar, toggle switch Light/Dark mode, switcher bahasa ID/EN, form ganti password, tombol logout.
- [x] **Task D.3: Halaman Riwayat Pemesanan Mahasiswa**
  * *Referensi:* Layar 11 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_riwayat_pemesanan/code.html`)
  * *File:* `src/app/(mahasiswa)/riwayat/page.tsx`
  * *Endpoint:* `GET /api/orders`
  * *Kriteria:* Tab filter status (`Semua`, `Berjalan`, `Selesai`, `Dibatalkan`), kartu riwayat transaksi dengan snapshot harga menu, tombol `Lacak` dan tombol `Pesan Lagi`.
- [x] **Task D.4: Status Operasional Toko & Manajemen Menu Penjual**
  * *Referensi:* Layar 12 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_status_manajemen_toko/code.html`)
  * *File:* `src/app/(penjual)/seller/status-toko/page.tsx`
  * *Endpoint:* `PATCH /api/seller/canteen`, `GET /api/seller/menu`, `PATCH /api/seller/menu/:id/toggle-stock`
  * *Kriteria:* Master switch Buka/Tutup Toko (broadcast live), ubah banner/QRIS loket, daftar menu dengan switch cepat stok `Tersedia`/`Habis`, modal edit & tambah menu.

---

## 👤 MELVERN — DETAIL KANTIN, KATALOG MENU & PIPELINE PESANAN MASUK

*Fokus: Pengalaman eksplorasi menu mahasiswa dan alur kerja pemrosesan makanan penjual.*

- [x] **Task M.1: Halaman Detail Loket Kantin & Menu**
  * *Referensi:* Layar 07 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_detail_kantin_menu_antrean/code.html`)
  * *File:* `src/app/(mahasiswa)/kantin/[id]/page.tsx`
  * *Endpoint:* `GET /api/canteens/:id`
  * *Kriteria:*
    - Header banner loket, tombol favorit hati SVG.
    - Panel status antrean live (jumlah antrean berjalan & estimasi menit tunggu).
    - Kategori filter menu.
    - Kartu menu dengan badge `BESTSELLER` terracotta, foto 82px, dan tombol `+ Pick-Up`.
    - **Pencegahan Stok:** Menu dengan status `Habis` wajib menampilkan tombol disabled abu-abu bertuliskan `Habis` dan kartu tidak bisa diklik.
    - Sticky bottom bar ringkasan item terpilih menuju `/keranjang`.
- [x] **Task M.2: Layar Pesanan Masuk Real-Time Penjual**
  * *Referensi:* Layar 13 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_pesanan_masuk_real_time/code.html`)
  * *File:* `src/app/(penjual)/seller/pesanan/page.tsx`
  * *Endpoint:* `GET /api/seller/orders`, `PATCH /api/seller/orders/:id/*`, `GET /api/sse/canteen/:id`
  * *Kriteria:*
    - Notifikasi pesanan baru masuk via SSE tanpa reload browser.
    - Kartu pesanan memuat nomor antrean besar (`A-012`), nama pembeli, jam pesan, rincian menu + catatan khusus.
    - Modal preview foto struk pembayaran.
    - Tombol aksi berurutan: `Verifikasi Bayar Valid` -> input estimasi saji -> `Mulai Masak` -> `Siap Diambil`.

---

## 👤 AGIT — KERANJANG, GATE BUKTI BAYAR, PELACAKAN & RATING

*Fokus: Integritas transaksi, gate upload pembayaran, status antrean real-time, dan ulasan bintang.*

- [x] **Task A.1: Keranjang Belanja & Gate Bukti Bayar Wajib**
  * *Referensi:* Layar 08 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_keranjang_bukti_bayar/code.html`)
  * *File:* `src/app/(mahasiswa)/keranjang/page.tsx`
  * *Endpoint:* `POST /api/uploads/payment-proof`, `POST /api/orders`
  * *Kriteria:*
    - Stepper kuantitas item (`-` dan `+`) dan textarea catatan per menu.
    - Pilihan metode `QRIS` (tampilkan gambar QR loket) atau `Tunai`.
    - Area upload bukti struk transfer (validasi MIME JPG/PNG/WEBP maks 5 MB).
    - **GATE MUTLAK:** Tombol `Kirim Pesanan ke Ibu Kantin` berstatus **DISABLED** sampai bukti bayar berhasil diunggah.
    - Transaksional pembuatan pesanan di server + generate nomor antrean unik harian.
- [x] **Task A.2: Pelacakan Status Antrean Real-Time Mahasiswa**
  * *Referensi:* Layar 09 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_pelacakan_status_pesanan/code.html`)
  * *File:* `src/app/(mahasiswa)/pesanan/[id]/page.tsx`
  * *Endpoint:* `GET /api/orders/:id`, `GET /api/sse/order/:id`
  * *Kriteria:*
    - Display nomor antrean besar (`A-012`).
    - Stepper animasi real-time (`Antrian` -> `Masak` -> `Siap Ambil`) terupdate via SSE.
    - Countdown waktu tunggu estimasi menit saji.
    - Saat pesanan berstatus `SIAP_AMBIL`, tampilkan tombol `Sudah Saya Ambil` untuk menyelesaikan transaksi (status berubah menjadi `PICKED_UP`) dan mengarahkan kembali ke `/riwayat`.

---

## 🏛️ FASE AKHIR — ANALITIK, BANNED USER & MODUL ADMIN UTAMA

- [x] **Task Final.1: Statistika Penjualan Ibu Kantin**
  * *Referensi:* Layar 14 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_statistika_penjualan/code.html`)
  * *File:* `src/app/(penjual)/seller/statistika/page.tsx`
  * *Kriteria:* Filter periode (hari ini, 7 hari, 30 hari), kartu KPI omzet dan porsi, grafik batang penjualan, top 5 menu terlaris.
- [x] **Task Final.2: Manajemen Blacklist / Banned User Anti-Abuse**
  * *Referensi:* Layar 15 (`stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_banned_user_anti_abuse/code.html`)
  * *File:* `src/app/(penjual)/seller/banned/page.tsx`
  * *Kriteria:* Daftar mahasiswa terblokir (alasan bukti palsu / ghosting order tunai), tombol Buka Blokir (Unban), validasi server agar user di blacklist ditolak saat checkout.
- [x] **Task Final.3: Layar Admin — Verifikasi & Manajemen Akun Kantin**
  * *Referensi:* Layar Admin 01 (`stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_verifikasi_manajemen_akun_kantin/code.html`)
  * *File:* `src/app/(admin)/admin/verifikasi/page.tsx`
  * *Kriteria:* Sidebar kaca desktop 1440px, tab segmented (Menunggu ACC, Aktif, Nonaktif), tombol cepat `ACC` dan `Tolak`, drawer detail pendaftaran, modal input alasan penolakan.
- [x] **Task Final.4: Layar Admin — Statistika Pemakaian Platform**
  * *Referensi:* Layar Admin 02 (`stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_statistika_pemakaian_platform/code.html`)
  * *File:* `src/app/(admin)/admin/stats/page.tsx`
  * *Kriteria:* KPI transaksi seluruh kampus, grafik tren harian, heatmap jam sibuk (peak hours 11.00-13.00), tabel peringkat performa loket.
- [x] **Task Final.5: Layar Admin — Pusat Resolusi & Komplain User**
  * *Referensi:* Layar Admin 03 (`stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_pusat_resolusi_komplain_user/code.html`)
  * *File:* `src/app/(admin)/admin/komplain/page.tsx`
  * *Kriteria:* Layout dua panel (inbox tiket keluhan mahasiswa/penjual & thread percakapan resolusi dengan dropdown status).
- [x] **Task Final.6: Verifikasi & Uji Alur Penuh (End-to-End Acceptance Test)**
  * Registrasi mahasiswa & penjual -> ACC penjual oleh admin -> penjual setup menu & buka toko -> mahasiswa pesan menu + upload bukti bayar -> verifikasi penjual -> masak -> siap saji (SSE update otomatis tanpa reload) -> ambil pesanan di loket (status PICKED_UP selesai).
