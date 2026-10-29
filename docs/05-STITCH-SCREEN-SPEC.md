# 05 — Spesifikasi Teknis 18 Layar Stitch (Screen-by-Screen Master Spec)

> **PENTING UNTUK AI AGENT:**  
> Seluruh desain antarmuka VetaBite **SUDAH DIBUATKAN KODE HTML-NYA** di folder `stitch-references/`.  
> Saat Anda mengimplementasikan sebuah route atau halaman, **JANGAN MENGAWANG-AWANG ATAU MEMBUAT TAMPILAN DARI NOL**. Buka file `code.html` yang tertera pada spesifikasi di bawah, salin struktur DOM, kelas Tailwind CSS, serta styling Liquid Glass-nya, lalu bungkus menjadi komponen React yang dinamis!

---

## 📑 DAFTAR ISI 18 LAYAR

### Bagian A: Modul Admin Utama (`STITCH_ADMIN.zip`)
1. [Layar Admin 01: Verifikasi & Manajemen Akun Kantin](#layar-admin-01--verifikasi--manajemen-akun-kantin)
2. [Layar Admin 02: Statistika Pemakaian Platform Kampus](#layar-admin-02--statistika-pemakaian-platform-kampus)
3. [Layar Admin 03: Pusat Resolusi & Komplain User](#layar-admin-03--pusat-resolusi--komplain-user)

### Bagian B: Modul Keseluruhan Mahasiswa, Auth & Penjual (`STITCH_KESELURUHAN.zip`)
4. [Layar 01: Welcome & Get Started](#layar-01--welcome--get-started)
5. [Layar 02: Login & Registrasi Multi-Role](#layar-02--login--registrasi-multi-role)
6. [Layar 03: Status Verifikasi Akun Ibu Kantin (Pending)](#layar-03--status-verifikasi-akun-ibu-kantin-pending)
7. [Layar 04: Dashboard Utama Mahasiswa](#layar-04--dashboard-utama-mahasiswa)
8. [Layar 05: Hasil Pencarian & Riwayat Search](#layar-05--hasil-pencarian--riwayat-search)
9. [Layar 06: Profil, Pengaturan Akun & Tema](#layar-06--profil-pengaturan-akun--tema)
10. [Layar 07: Detail Kantin, Menu & Antrean](#layar-07--detail-kantin-menu--antrean)
11. [Layar 08: Keranjang Belanja & Gate Bukti Bayar](#layar-08--keranjang-belanja--gate-bukti-bayar)
12. [Layar 09: Pelacakan Status Antrean Real-Time](#layar-09--pelacakan-status-antrean-real-time)
13. [Layar 10: Beri Rating & Ulasan 5 Bintang](#layar-10--beri-rating--ulasan-5-bintang)
14. [Layar 11: Riwayat Pemesanan Mahasiswa](#layar-11--riwayat-pemesanan-mahasiswa)
15. [Layar 12: Status Operasional Toko & Manajemen Menu](#layar-12--status-operasional-toko--manajemen-menu)
16. [Layar 13: Pesanan Masuk Real-Time Ibu Kantin](#layar-13--pesanan-masuk-real-time-ibu-kantin)
17. [Layar 14: Statistika Penjualan Ibu Kantin](#layar-14--statistika-penjualan-ibu-kantin)
18. [Layar 15: Banned User & Anti-Abuse Kantin](#layar-15--banned-user--anti-abuse-kantin)

---

## 🏛️ BAGIAN A: MODUL ADMIN UTAMA (`STITCH_ADMIN.zip`)

### Layar Admin 01 — Verifikasi & Manajemen Akun Kantin
* **Path Referensi Stitch:** `stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_verifikasi_manajemen_akun_kantin/code.html`
* **Target Route:** `/admin/verifikasi`
* **Layout:** Desktop-first (1440px grid), sidebar glass di sebelah kiri, area konten dinamis di kanan.
* **Komponen & Elemen Kunci:**
  1. *Sidebar Kaca:* Logo VetaBite, menu navigasi (Verifikasi Kantin, Statistika, Komplain), Theme Toggle, profil Admin.
  2. *Top Metric Cards:* 3 kartu kaca (Menunggu Verifikasi, Kantin Aktif, Kantin Nonaktif/Ditolak).
  3. *Search & Filter:* Search bar "Cari nama loket / pemilik" dan segmented tab `Menunggu ACC` | `Aktif` | `Nonaktif/Ditolak`.
  4. *Tabel Antrean Pendaftar (Tab Menunggu ACC):*
     - Kolom: Nama Pemilik, Nama Loket, Deskripsi, No. WhatsApp, Tanggal Daftar, Aksi.
     - Aksi Cepat: Tombol hijau `ACC` dan tombol merah `Tolak`.
  5. *Drawer Samping Kanan (Detail Pendaftaran):* Terbuka saat baris diklik, memuat detail lengkap berkas loket, preview banner, dan tombol konfirmasi.
  6. *Modal Tolak Pendaftaran:* Input teks textarea untuk mengisi alasan penolakan (wajib diisi).
* **API Terhubung:** `GET /api/admin/canteens`, `POST /api/admin/canteens/:id/approve`, `POST /api/admin/canteens/:id/reject`.
* **State:** Loading skeleton tabel, empty state "Belum ada pendaftaran kantin baru".

---

### Layar Admin 02 — Statistika Pemakaian Platform Kampus
* **Path Referensi Stitch:** `stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_statistika_pemakaian_platform/code.html`
* **Target Route:** `/admin/stats`
* **Layout:** Desktop-first (1440px), sidebar glass kiri, dashboard grid analitik.
* **Komponen & Elemen Kunci:**
  1. *Filter Waktu:* Pill dropdown `Hari ini` | `7 Hari Terakhir` | `30 Hari Terakhir`.
  2. *KPI Glass Cards:*
     - Total Transaksi Hari Ini (Rp dan kuantitas transaksi).
     - Pengguna Aktif Harian (Mahasiswa & Penjual).
     - Tingkat Keberhasilan Pick-Up (Persentase, misal: 96.4%).
     - Jumlah Loket Aktif Buka.
  3. *Grafik Recharts:*
     - Grafik Garis: Tren transaksi harian (warna terracotta accent `#E03A00`).
     - Grafik Batang Jam Sibuk (Peak Hours): Menyoroti lonjakan pukul 11:00 - 13:00 WIB.
  4. *Tabel Performa per Kantin:* Peringkat loket berdasarkan omzet, rating, dan kecepatan saji.
* **API Terhubung:** `GET /api/admin/stats?range=today|week|month`.

---

### Layar Admin 03 — Pusat Resolusi & Komplain User
* **Path Referensi Stitch:** `stitch-references/STITCH_ADMIN/stitch_vetabike/vetabite_admin_pusat_resolusi_komplain_user/code.html`
* **Target Route:** `/admin/komplain`
* **Layout:** Dua panel (Left: Inbox Tiket; Right: Percakapan & Detail Resolusi).
* **Komponen & Elemen Kunci:**
  1. *Panel Kiri (Inbox):*
     - Tab filter: `Semua` | `Dari Mahasiswa` | `Dari Pemilik Kantin`.
     - Filter status pill: `Baru`, `Diproses`, `Selesai`.
     - Kartu tiket: Avatar pelapor, badge role (Mahasiswa / Penjual), subjek keluhan, preview pesan, waktu masuk.
  2. *Panel Kanan (Detail Tiket Terpilih):*
     - Info pelapor, link transaksi pesanan terkait (jika ada).
     - Tampilan percakapan berbalas (bubble chat Liquid Glass).
     - Lampiran bukti foto keluhan.
     - Input form balasan admin + dropdown ubah status (`DIPROSES` / `SELESAI`).
* **API Terhubung:** `GET /api/admin/complaints`, `POST /api/admin/complaints/:id/messages`, `PATCH /api/admin/complaints/:id`.

---

## 📱 BAGIAN B: MODUL MAHASISWA, AUTH & PENJUAL (`STITCH_KESELURUHAN.zip`)

### Layar 01 — Welcome & Get Started
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_welcome_get_started/code.html`
* **Target Route:** `/` (Public Landing)
* **Layout:** Mobile envelope (430px centered di desktop) dengan aksen cahaya hangat.
* **Komponen & Elemen Kunci:**
  1. *Hero Brand Section:* Logo VetaBite, typography `headline-hero` "Kantin UPNVJ Tanpa Antre".
  2. *Value Proposition Pills:* 3 badge kaca ("Pesan dari Kelas", "Pantau Antrean Live", "Ambil Tinggal Tunjuk").
  3. *Primary CTA Button:* Tombol besar pill orange `Mulai Sekarang` -> navigasi ke `/login`.
  4. *Secondary Link:* "Sudah punya akun? Masuk" di bawah tombol utama.
* **State:** Statis, transisi animasi halus saat tombol ditekan.

---

### Layar 02 — Login & Registrasi Multi-Role
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_login_registrasi_multi_role/code.html`
* **Target Route:** `/login` dan `/register`
* **Layout:** Container Glass 430px dengan tab segmented control di bagian atas.
* **Komponen & Elemen Kunci:**
  1. *Tab Switcher Kaca:* `Masuk` | `Daftar Akun Baru`.
  2. *Form Login:*
     - Input Username & Password dengan ikon SVG di dalam field.
     - Tombol `Masuk ke VetaBite` (dengan loading spinner state).
     - Deteksi otomatis role: Pembeli -> `/dashboard`, Penjual -> `/seller/pesanan`, Admin -> `/admin/verifikasi`.
  3. *Form Registrasi:*
     - Role Selector Glass: Pilihan radio card `Mahasiswa (Pembeli)` vs `Ibu Kantin (Penjual)`.
     - Input Nama Lengkap, Username, Password, Nomor WhatsApp.
     - *Jika Ibu Kantin dipilih, tampilkan field tambahan:* Nama Loket Kantin dan Deskripsi Menu.
     - Tombol `Daftar Sekarang`.
* **API Terhubung:** `POST /api/auth/login`, `POST /api/auth/register`.
* **Validasi:** Username min 4 karakter alfanumerik, password min 6 karakter.

---

### Layar 03 — Status Verifikasi Akun Ibu Kantin (Pending)
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_status_verifikasi_akun_ibu_kantin/code.html`
* **Target Route:** `/pending-verification`
* **Layout:** Kartu Liquid Glass terpusat dengan ikon jam pasir SVG bercahaya hangat.
* **Komponen & Elemen Kunci:**
  1. *Icon Status:* Lingkaran kaca dengan ikon jam pasir / verifikasi SVG bernuansa amber `#D9A441`.
  2. *Judul & Copy:* "Pendaftaran Loket Sedang Diverifikasi", penjelasan bahwa admin UPNVJ sedang mengecek data loket.
  3. *Info Loket:* Ringkasan nama loket dan nomor WhatsApp yang didaftarkan.
  4. *Bantuan & Logout:* Tombol hubungi admin via WhatsApp dan tombol `Keluar dari Akun`.
* **Aturan RBAC:** Penjual dengan `status === "PENDING"` otomatis dikunci di halaman ini oleh middleware.

---

### Layar 04 — Dashboard Utama Mahasiswa
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_dashboard_utama/code.html`
* **Target Route:** `/dashboard`
* **Layout:** Handheld envelope (max 430px), bottom dock clearance 92px.
* **Komponen & Elemen Kunci:**
  1. *Sticky Header:* Greeting mahasiswa ("Halo, Daffa!"), pill keranjang aktif (badge jumlah item), dan avatar profil.
  2. *Integrated Search Trigger:* Bar pencarian kaca yang mengarahkan ke `/search`.
  3. *Hero Promo Banner:* Slider kartu diskon / promo kantin UPNVJ dengan specular rim highlight.
  4. *Kategori Horizontal Scroll:* Chip filter pill (`Semua`, `Makanan`, `Minuman`, `Camilan`).
  5. *Daftar Loket Kantin (Stall Directory Cards):*
     - Thumbnail foto loket (tinggi 118px).
     - Badge absolute: `Loket #01` dan `Siap 8 Menit`.
     - Nama loket, ringkasan menu yang dijual, rating bintang SVG (misal: 4.9/5.0).
     - Status badge: `Buka` (hijau) atau `Tutup` (abu-abu).
  6. *Floating Bottom Navigation Dock:* 4 ikon navigasi (Home, Search, Riwayat, Profil).
* **API Terhubung:** `GET /api/canteens`.

---

### Layar 05 — Hasil Pencarian & Riwayat Search
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_hasil_pencarian_riwayat/code.html`
* **Target Route:** `/search`
* **Layout:** Mobile 430px, layout pencarian cepat.
* **Komponen & Elemen Kunci:**
  1. *Active Search Bar:* Input teks dengan tombol clear `x` dan fokus instan.
  2. *Riwayat Pencarian (Recent Searches):* Chip kata kunci yang pernah dicari user + tombol "Hapus Semua".
  3. *Tab Filter Hasil:* `Semua` | `Loket Kantin` | `Menu Makanan`.
  4. *Hasil Menu Terkait:* Kartu menu horizontal dengan harga dan tombol langsung ke loket.
* **API Terhubung:** `GET /api/canteens?q=...`, `GET /api/me/search-history`, `DELETE /api/me/search-history`.

---

### Layar 06 — Profil, Pengaturan Akun & Tema
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_profile_settings_manage_account/code.html`
* **Target Route:** `/profil`
* **Layout:** Mobile 430px, list card pengaturan Liquid Glass.
* **Komponen & Elemen Kunci:**
  1. *Header Profil:* Foto avatar dengan tombol edit kamera SVG, nama lengkap, username, dan badge role mahasiswa.
  2. *Section Preferensi Tampilan:*
     - Toggle Switch Tema: `Light Mode` (Warm Cream) vs `Dark Mode` (Deep Espresso).
     - Segmented Control Bahasa: `Indonesia` vs `English`.
  3. *Section Keamanan Akun:* Form ganti nama lengkap dan ganti password (input lama & baru).
  4. *Tombol Keluar (Logout):* Tombol danger glass merah di bagian bawah.
* **API Terhubung:** `GET /api/me`, `PATCH /api/me`, `POST /api/auth/logout`.

---

### Layar 07 — Detail Kantin, Menu & Antrean
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_detail_kantin_menu_antrean/code.html`
* **Target Route:** `/kantin/[id]`
* **Layout:** Mobile 430px, header sticky hero loket, katalog vertikal.
* **Komponen & Elemen Kunci:**
  1. *Stall Header Banner:* Foto banner loket, tombol back bulat, tombol favorit hati SVG.
  2. *Live Queue Status Panel:* Kotak kaca memuat indikator "3 Antrean Berjalan" dan "Estimasi 12 Menit".
  3. *Menu List Horizontal Categories:* Sticky chip kategori menu.
  4. *Kartu Menu (Menu Cards):*
     - Thumbnail foto makanan (82px x 82px).
     - Nama menu, deskripsi bahan/rasa (maksimal 2 baris).
     - Badge `BESTSELLER` terracotta jika menu terlaris.
     - Label harga `Rp 15.000`.
     - Tombol `+ Pick-Up` orange. Jika stok `Habis`, tombol menjadi disabled abu-abu bertuliskan `Habis`.
  5. *Sticky Bottom Bar:* Menampilkan jumlah item terpilih dan tombol `Lihat Keranjang (Rp 32.000)`.
* **API Terhubung:** `GET /api/canteens/:id`.

---

### Layar 08 — Keranjang Belanja & Gate Bukti Bayar
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_keranjang_bukti_bayar/code.html`
* **Target Route:** `/keranjang`
* **Layout:** Mobile 430px, checkout form vertikal.
* **Komponen & Elemen Kunci:**
  1. *Daftar Item Pesanan:*
     - Kartu per item dengan kontrol kuantitas (`-` dan `+`) serta input catatan ke penjual.
  2. *Metode Pembayaran:*
     - Toggle segmented: `QRIS` vs `Tunai`.
     - Jika QRIS: Tampilkan kartu gambar QR loket kantin yang bisa di-zoom / diunduh.
  3. *GATE BUKTI BAYAR WAJIB (Uploader Box):*
     - Area drag & drop / klik upload bukti transfer struk (JPG/PNG/WEBP, maks 5 MB).
     - Preview gambar struk setelah berhasil diunggah dengan opsi ganti file.
  4. *Ringkasan Biaya:* Subtotal pesanan, biaya layanan (Rp 0), Total Bayar.
  5. *Tombol Submit Checkout:*
     - Tombol pill orange besar `Kirim Pesanan ke Ibu Kantin`.
     - **ATURAN MUTLAK:** Tombol wajib **DISABLED** sampai bukti bayar selesai diunggah dan diverifikasi klien.
* **API Terhubung:** `POST /api/uploads/payment-proof`, `POST /api/orders`.

---

### Layar 09 — Pelacakan Status Antrean Real-Time
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_pelacakan_status_pesanan/code.html`
* **Target Route:** `/pesanan/[id]`
* **Layout:** Mobile 430px, live tracking card.
* **Komponen & Elemen Kunci:**
  1. *Kartu Nomor Antrean:* Display nomor besar (misal: `A-012`) dengan teks "Tunjukkan nomor ini saat mengambil di loket".
  2. *Live Stepper Indicator (SSE Updated):*
     - Step 1: `Antrian` (Menunggu konfirmasi penjual).
     - Step 2: `Masak` (Sedang disiapkan di wajan/dapur loket).
     - Step 3: `Siap Ambil` (Hijau menyala, makanan telah dibungkus).
  3. *Countdown Waktu Tunggu:* Estimasi dinamis ("Perkiraan siap dalam 7 menit").
  4. *Info Loket & Rincian Pesanan:* Nama loket, tombol telepon/WA loket, ringkasan menu yang dipesan.
  5. *Aksi Saat Siap Ambil:* Jika status berubah menjadi `SIAP_AMBIL`, muncul tombol konfirmasi `Sudah Saya Ambil` -> mengubah status menjadi `PICKED_UP` (selesai) dan kembali ke `/dashboard` atau `/riwayat`.
* **API Terhubung:** `GET /api/orders/:id`, `GET /api/sse/order/:id`.

---

### Layar 10 — [DINONAKTIFKAN / DIHAPUS] Beri Rating Makanan
*(Fitur rating makanan ditiadakan dari sistem VetaBite. Layar prototipe `vetabite_mahasiswa_beri_rating_pesanan_diambil` diabaikan, alur pesanan langsung selesai di status `PICKED_UP`).*

---

### Layar 11 — Riwayat Pemesanan Mahasiswa
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_mahasiswa_riwayat_pemesanan/code.html`
* **Target Route:** `/riwayat`
* **Layout:** Mobile 430px, daftar vertikal.
* **Komponen & Elemen Kunci:**
  1. *Filter Tab Status:* `Semua` | `Sedang Berjalan` | `Selesai` | `Dibatalkan`.
  2. *Kartu Riwayat Pesanan:*
     - Tanggal transaksi, nama loket kantin, nomor antrean.
     - Ringkasan item pesanan (snapshot nama & qty).
     - Total harga Rupiah.
     - Pill status pesanan berwarna sesuai tema.
     - Tombol aksi: `Lacak Pesanan` (jika aktif) atau `Pesan Lagi` (reorder instan).
* **API Terhubung:** `GET /api/orders`.

---

### Layar 12 — Status Operasional Toko & Manajemen Menu
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_status_manajemen_toko/code.html`
* **Target Route:** `/seller/status-toko`
* **Layout:** Mobile/Tablet 768px penjual.
* **Komponen & Elemen Kunci:**
  1. *Master Store Switch:* Switch toggle besar `Toko Buka` (Hijau) / `Toko Tutup` (Abu-abu). Mengubah visibilitas loket di aplikasi mahasiswa secara real-time.
  2. *Edit Banner & QRIS Loket:* Tombol ganti banner dan upload QRIS baru.
  3. *Daftar Menu Loket:*
     - Kartu per menu dengan foto thumbnail, nama, dan harga.
     - **Toggle Ketersediaan Cepat:** Switch `Tersedia` vs `Habis`.
     - Tombol Edit Menu (buka modal edit harga & deskripsi) dan Tambah Menu Baru.
* **API Terhubung:** `PATCH /api/seller/canteen`, `GET/POST /api/seller/menu`, `PATCH /api/seller/menu/:id`.

---

### Layar 13 — Pesanan Masuk Real-Time Ibu Kantin
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_pesanan_masuk_real_time/code.html`
* **Target Route:** `/seller/pesanan`
* **Layout:** Kanban/Grid pesanan real-time penjual.
* **Komponen & Elemen Kunci:**
  1. *Status Bar & Audio Alert:* Notifikasi visual dan chime saat ada pesanan baru masuk via SSE.
  2. *Kartu Pesanan Masuk:*
     - Header kartu: Nomor antrean besar (`A-012`), nama pembeli, jam masuk pesanan.
     - Badge status pembayaran: `Belum Dibayar` (amber) atau `Sudah Dibayar` (hijau).
     - Rincian item yang harus dimasak + catatan khusus pembeli ("Es teh jangan manis").
     - Modal viewer thumbnail bukti pembayaran untuk mengecek struk.
  3. *Aksi Alur Kerja Penjual:*
     - Tombol 1: `Verifikasi Bayar Valid` -> ubah payment status.
     - Input estimasi menit masak (default 15 menit).
     - Tombol 2: `Mulai Masak` -> ubah order status ke `MASAK`.
     - Tombol 3: `Pesanan Siap Diambil` -> ubah ke `SIAP_AMBIL` (broadcast ke mahasiswa).
     - Aksi Overflow: Opsi batalkan pesanan (jika bukti palsu) atau blokir user.
* **API Terhubung:** `GET /api/seller/orders`, `PATCH /api/seller/orders/:id/*`, `GET /api/sse/canteen/:id`.

---

### Layar 14 — Statistika Penjualan Ibu Kantin
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_statistika_penjualan/code.html`
* **Target Route:** `/seller/statistika`
* **Layout:** Dashboard analitik penjual.
* **Komponen & Elemen Kunci:**
  1. *Filter Waktu:* `Hari Ini` | `7 Hari` | `Bulan Ini`.
  2. *KPI Cards:* Total Omzet Pendapatan (Rp), Total Porsi Terjual, Rata-rata Rating Loket.
  3. *Grafik Penjualan:* Grafik batang tren pemasukan.
  4. *Daftar Menu Terlaris (Top 5):* Menu teratas berdasarkan kuantitas terjual.
* **API Terhubung:** `GET /api/seller/stats`.

---

### Layar 15 — Banned User & Anti-Abuse Kantin
* **Path Referensi Stitch:** `stitch-references/STITCH_KESELURUHAN/stitch_vetabike/vetabite_ibu_kantin_banned_user_anti_abuse/code.html`
* **Target Route:** `/seller/banned`
* **Layout:** Panel proteksi anti-abuse penjual.
* **Komponen & Elemen Kunci:**
  1. *Header Edukasi Anti-Abuse:* Informasi perlindungan terhadap order palsu dan ghosting tunai.
  2. *Tabel Pengguna Terblokir:*
     - Nama mahasiswa, username, tanggal pemblokiran, alasan blokir ("Struk Palsu", "Order fiktif").
     - Tombol `Buka Blokir (Unban)` dengan modal konfirmasi.
  3. *Trigger Blokir Baru:* Dapat menambahkan mahasiswa ke daftar hitam via username atau langsung dari kartu pesanan.
* **API Terhubung:** `GET /api/seller/bans`, `POST /api/seller/bans`, `DELETE /api/seller/bans/:userId`.
