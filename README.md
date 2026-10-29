# VetaBite — AI Developer & Coding Agent Work Pack

Selamat datang di Work Pack resmi **VetaBite** (Aplikasi Pemesanan & Antrean Makanan Cerdas Kantin UPN Veteran Jakarta).  
Paket dokumen ini dirancang khusus untuk **AI Coding Agent** (Cursor, Claude Code, Antigravity, GitHub Copilot) dan tim pengembang agar dapat mengeksekusi implementasi sistem secara mandiri, presisi, tanpa halusinasi, dan tanpa "bengong".

---

## 🗂️ Struktur Dokumen Spesifikasi (Telah Disederhanakan & Diperdalam)

Dokumen telah dirampingkan dari belasan berkas terfragmentasi menjadi **6 Dokumen Inti yang Komprehensif** di dalam folder `docs/`:

```
VetaBite-AI-Pack/
├── AGENTS.md                          # [BACA PERTAMA] Master Execution & Anti-Bengong Protocol
├── README.md                          # Peta panduan proyek (file ini)
├── docs/
│   ├── 01-PRD-DAN-ALUR.md             # Kebutuhan produk, matrix 3 role, state machine & aturan bisnis
│   ├── 02-DESIGN-SYSTEM-STITCH.md     # Token Liquid Glass (Liquid Amber), CSS variables, typography, SVG
│   ├── 03-ARSITEKTUR-DAN-DATABASE.md  # Struktur App Router, skema Prisma PostgreSQL lengkap, seed, RBAC
│   ├── 04-API-DAN-REALTIME-SPEC.md    # Kontrak REST API lengkap, Zod schema payload, event SSE real-time
│   ├── 05-STITCH-SCREEN-SPEC.md       # [KUNCI UI] Spesifikasi teknis 18 layar Stitch (routes, state, logic)
│   └── 06-TASKS-PER-PIC.md            # Backlog tugas bertahap per PIC (Faiz, Doniska, Melvern, Agit, Admin)
└── stitch-references/                 # Ekstrak 18 layar referensi Stitch (code.html & screen.png)
    ├── STITCH_ADMIN/                  # 3 Layar modul admin utama
    └── STITCH_KESELURUHAN/            # 15 Layar mahasiswa, auth, profil, dan ibu kantin
```

---

## ⚡ Urutan Baca Wajib untuk AI Agent

Sebelum mulai menulis satu baris kode pun, AI **WAJIB** membaca dokumen secara berurutan:
1. `AGENTS.md` — pahami batasan keamanan, zero emoji rule, validasi server, dan definition of done.
2. `docs/01-PRD-DAN-ALUR.md` — pahami domain problem kantin UPNVJ dan status flow pesanan.
3. `docs/02-DESIGN-SYSTEM-STITCH.md` — pahami token Liquid Glass agar styling konsisten.
4. `docs/03-ARSITEKTUR-DAN-DATABASE.md` — pahami struktur tabel database dan relasinya.
5. `docs/04-API-DAN-REALTIME-SPEC.md` — pahami endpoint dan format data JSON.
6. `docs/05-STITCH-SCREEN-SPEC.md` — pelajari pemetaan 18 layar ke file `code.html` di `stitch-references/`.
7. `docs/06-TASKS-PER-PIC.md` — ambil task secara berurutan dan eksekusi per fase!

---

## 🎨 Referensi Desain Stitch (18 Layar Siap Pakai)

UI telah dirancang dengan presisi menggunakan Google Stitch mengusung tema **iOS Liquid Glass (Liquid Amber Refraction)**. Seluruh HTML & CSS Tailwind sudah tersedia di folder `stitch-references/`:

* **Modul Admin (3 Layar):**
  1. `stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_verifikasi_manajemen_akun_kantin/code.html`
  2. `stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_statistika_pemakaian_platform/code.html`
  3. `stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_pusat_resolusi_komplain_user/code.html`

* **Modul Auth, Mahasiswa & Penjual (15 Layar):**
  1. `vetabite_welcome_get_started` (Landing Page)
  2. `vetabite_login_registrasi_multi_role` (Login & Registrasi Multi-Role)
  3. `vetabite_status_verifikasi_akun_ibu_kantin` (Status Pending Akun Penjual)
  4. `vetabite_mahasiswa_dashboard_utama` (Dashboard Utama Mahasiswa)
  5. `vetabite_hasil_pencarian_riwayat` (Pencarian Menu & Riwayat)
  6. `vetabite_profile_settings_manage_account` (Profil, Pengaturan Akun & Tema)
  7. `vetabite_mahasiswa_detail_kantin_menu_antrean` (Halaman Loket Kantin & Menu)
  8. `vetabite_mahasiswa_keranjang_bukti_bayar` (Keranjang & Gate Bukti Bayar)
  9. `vetabite_mahasiswa_pelacakan_status_pesanan` (Pelacakan Antrean Real-time)
  10. `vetabite_mahasiswa_beri_rating_pesanan_diambil` (Rating & Ulasan 5 Bintang)
  11. `vetabite_mahasiswa_riwayat_pemesanan` (Riwayat Transaksi Pesanan)
  12. `vetabite_ibu_kantin_status_manajemen_toko` (Buka/Tutup Toko & Manajemen Menu)
  13. `vetabite_ibu_kantin_pesanan_masuk_real_time` (Daftar Pesanan Masuk Real-time)
  14. `vetabite_ibu_kantin_statistika_penjualan` (Statistik Omzet & Menu Terlaris)
  15. `vetabite_ibu_kantin_banned_user_anti_abuse` (Pusat Pemblokiran Pembeli Nakal)

Detail lengkap komponen, props, routing, dan logic per layar dapat dilihat pada [docs/05-STITCH-SCREEN-SPEC.md](file:///c:/Users/Gheffira/Downloads/FILE%20DHAFA2/PROYEKAN/docs/05-STITCH-SCREEN-SPEC.md).

## Kredensial Demo (seed)

| Role | Username | Password |
|---|---|---|
| Admin | dhafagifari0412@gmail.com | Admin123! |
| Penjual | sandinurfajarpapakajuhaindini@gmail.com | Kantin123! |
| Mahasiswa | mahasiswa1@mhs.upnvj.ac.id | Mhs12345! |

Jalankan: `npm install && npx prisma migrate dev && npm run db:seed && npm run dev`
