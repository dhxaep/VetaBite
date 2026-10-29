# 01 — PRD, Role & Alur Bisnis VetaBite

> **Ringkasan Eksekutif:**  
> VetaBite adalah web application pemesanan dan antrean makanan cerdas untuk Kantin UPN Veteran Jakarta (UPNVJ). Aplikasi ini memecahkan masalah antrean menumpuk dan ketidakpastian waktu saji dengan memungkinkan civitas akademika memesan makanan dari loket kantin, mengunggah bukti bayar, memantau estimasi masak secara real-time, dan mengambil makanan saat status sudah "Siap Ambil".

---

## 1. Matriks Tiga Peran Pengguna (Role Matrix)

| Role | Akses Utama | Tanggung Jawab & Batasan |
|---|---|---|
| **MAHASISWA** *(Pembeli)* | `/dashboard`, `/kantin/:id`, `/keranjang`, `/pesanan/:id`, `/riwayat`, `/profil`, `/search` | - Registrasi langsung berstatus `ACTIVE`.<br>- Menjelajahi loket kantin, mencari menu, filter harga.<br>- Menambah menu ke keranjang (hanya menu berstatus *Tersedia*).<br>- Checkout wajib mengunggah bukti bayar (QRIS/Tunai).<br>- Memantau antrean secara live (SSE).<br>- Mengambil pesanan langsung di loket saat siap saji.<br>- Mengajukan komplain jika ada kendala. |
| **PENJUAL** *(Ibu/Bapak Kantin)* | `/seller/pesanan`, `/seller/status-toko`, `/seller/statistika`, `/seller/banned` | - Registrasi berstatus `PENDING` (harus di-ACC Admin).<br>- Mengelola operasional loket (buka/tutup, edit banner, ganti QRIS).<br>- Mengelola menu (tambah, edit, harga, toggle Tersedia/Habis).<br>- Menerima pesanan live, verifikasi bukti bayar, update estimasi & status.<br>- Melihat statistik penjualan (harian/mingguan/bulanan).<br>- Memblokir pembeli yang curang/abuse (bukti transfer palsu, order spam).<br>- **Batasan:** Hanya bisa mengakses data loket miliknya sendiri! |
| **ADMIN UTAMA** | `/admin/verifikasi`, `/admin/stats`, `/admin/komplain` | - Memverifikasi pendaftaran akun Ibu Kantin baru (ACC / Tolak + alasan).<br>- Mengaktifkan / menonaktifkan loket kantin yang melanggar aturan.<br>- Memantau analitik platform UPNVJ (peak hours, total transaksi, user aktif).<br>- Menangani tiket komplain antara mahasiswa dan kantin.<br>- **Batasan Kritis:** Admin **TIDAK MENGELOLA** akun mahasiswa (data mahasiswa bersifat self-managed). |

---

## 2. Fitur Fungsional Berdasarkan PIC

### A. Faiz — Autentikasi & Navigasi
1. **Welcome Screen:** Halaman pengantar yang menjelaskan USP VetaBite dengan tombol masuk dan daftar.
2. **Auth Multi-Role (Login & Register):**
   - Tab switch antara Login dan Register dalam satu view glass.
   - Pilihan role saat registrasi: Mahasiswa (langsung `ACTIVE`) vs Ibu Kantin (otomatis `PENDING`).
   - Form registrasi penjual meminta informasi tambahan: Nama Loket, Deskripsi Loket, dan Nomor WhatsApp.
   - Deteksi role otomatis saat login, lalu redirect ke dashboard yang sesuai.
   - Handling status pendaftaran: jika penjual masih `PENDING`, diarahkan ke halaman tunggu verifikasi; jika `REJECTED`, tampilkan alasan penolakan; jika `INACTIVE`, tampilkan pesan penonaktifan.
3. **Navbar & Navigasi Utama:**
   - Search bar terintegrasi dengan dropdown riwayat pencarian.
   - Profile badge + dropdown navigasi.

### B. Doniska — Dashboard Mahasiswa & Pengaturan Toko Penjual
1. **Dashboard Utama Mahasiswa:**
   - Banner promo kampus UPNVJ.
   - Horizontal category scroll (Semua, Makanan, Minuman, Camilan).
   - Kartu direktori kantin: banner, logo, nama loket, badge rating, status Buka/Tutup, estimasi penyajian, dan link menu.
   - Filter rentang harga (murah ke mahal, di bawah Rp 15.000).
   - Floating pill navigation dock di bawah layar (Home, Search, Riwayat, Profil).
2. **Pengaturan Akun & Profil:**
   - Pengaturan tema (Liquid Glass Light Mode vs Dark Mode).
   - Pengaturan bahasa antarmuka (Bahasa Indonesia default / English).
   - Kelola akun: ubah foto avatar, ubah nama lengkap, dan ganti password.
3. **Manajemen Status Toko (Penjual):**
   - Switch toggle Buka/Tutup Toko (langsung broadcast status ke pembeli).
   - Upload/update gambar banner loket dan QRIS loket.
   - Manajemen katalog menu: toggle ketersediaan stok (Tersedia / Habis).

### C. Melvern — Katalog Kantin & Pipeline Pesanan Masuk
1. **Halaman Detail Kantin (Mahasiswa):**
   - Header profil loket kantin + badge jam operasional & rating.
   - Live queue status bar: menampilkan jumlah antrean berjalan dan perkiraan waktu tunggu.
   - Katalog menu terorganisir per kategori.
   - Menu item card: foto thumbnail, nama menu, deskripsi singkat, badge `BESTSELLER`, label harga Rupiah, dan tombol `+ Pick-Up`.
   - **Gate Stok:** Jika menu `Habis`, tombol `+ Pick-Up` berubah menjadi `Habis` berstatus disabled dan kartu menu menjadi semi-transparan.
2. **Papan Pesanan Masuk Real-Time (Penjual):**
   - Tampilan pesanan masuk tersinkronisasi via SSE tanpa reload browser.
   - Kartu pesanan memuat: nomor antrean (misal `A-012`), nama pembeli, jam masuk, daftar item pesanan dengan catatan khusus, total harga, dan thumbnail bukti bayar.
   - Aksi cepat: Tombol verifikasi pembayaran, input estimasi waktu saji (menit), dan pembaruan tahap masak.

### D. Agit — Keranjang, Pembayaran, Pelacakan & Rating
1. **Keranjang Belanja:**
   - Pengaturan kuantitas tiap menu (`+` dan `-`), input catatan khusus per menu (misal: "Jangan pakai pedas", "Es sedikit").
   - Kalkulasi subtotal, biaya layanan (Rp 0), dan total pembayaran.
2. **Gate Bukti Bayar Wajib (Payment Gate):**
   - Pilihan metode bayar: QRIS atau Tunai.
   - Jika QRIS: Tampilkan kode QR loket kantin yang bersangkutan.
   - **Aturan Mutlak:** Tombol "Kirim Pesanan ke Ibu Kantin" dalam keadaan **DISABLED** sampai pembeli mengunggah bukti pembayaran yang valid (format JPG/PNG/WEBP, maksimal 5 MB).
3. **Pelacakan Status Pesanan Real-Time:**
   - Tampilan nomor antrean besar yang harus ditunjukkan saat pengambilan.
   - Stepper interaktif real-time: `ANTRIAN` -> `MASAK` -> `SIAP_AMBIL` -> `PICKED_UP`.
   - Countdown timer estimasi pesanan siap saji.

### E. Fase Akhir — Analitik, Banned User, dan Modul Admin
1. **Statistika Penjualan (Penjual):**
   - Filter periode waktu: Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir.
   - Kartu metrik: Total Pemasukan (Rp), Total Porsi Terjual, Rata-rata Rating Toko.
   - Grafik batang omzet dan daftar 5 menu terlaris.
2. **Sistem Blacklist / Banned User (Penjual):**
   - Penjual dapat memblokir pembeli langsung dari kartu pesanan atau menu banned.
   - Alasan blokir: "Bukti transfer palsu", "Pesanan tunai tidak diambil (ghosting)", "Spam pesanan fiktif".
   - Tabel daftar pembeli terblokir dan tombol Buka Blokir (Unban).
   - Validasi checkout: Server menolak pesanan jika user ada di blacklist loket tersebut.
3. **Dashboard Admin Utama:**
   - **Verifikasi Akun Kantin:** Tabel daftar pendaftar Ibu Kantin baru dengan status `PENDING`. Admin dapat menekan tombol `ACC` (aktifkan) atau `Tolak` (membuka modal input alasan penolakan). Drawer samping kanan menampilkan detail berkas loket.
   - **Statistika Platform Kampus:** KPI total transaksi seluruh kampus, grafik garis transaksi harian, heatmap jam sibuk kantin (peak hours 11.00-13.00), dan tabel performa loket.
   - **Pusat Resolusi Komplain:** Panel ganda (kiri: daftar tiket keluhan mahasiswa/penjual; kanan: detail percakapan, bukti foto, dan form respon admin).

---

## 3. State Machine & Alur Siklus Hidup (Life Cycles)

### A. Siklus Akun Pengguna (Account Status Lifecycle)
```
[Registrasi Mahasiswa] ──────> ACTIVE (Langsung bisa bertransaksi)

[Registrasi Penjual]   ──────> PENDING (Menunggu verifikasi admin)
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
          [Admin Menyetujui]              [Admin Menolak]
                  │                               │
                  ▼                               ▼
               ACTIVE                          REJECTED
        (Loket aktif di sistem)         (+ Catatan alasan penolakan)
                  │
                  ▼ (Opsional jika melanggar)
               INACTIVE
```

### B. Siklus Transaksi Pesanan (Order Lifecycle)
```
Mahasiswa Checkout (Wajib Upload Bukti)
                  │
                  ▼
              ANTRIAN  ──[Pembayaran: BELUM_DIBAYAR]
                  │
                  ├──(Bukti palsu / penjual batalkan)──> DIBATALKAN
                  │
       (Penjual Verifikasi Bukti Bayar)
                  │
                  ▼
              ANTRIAN  ──[Pembayaran: SUDAH_DIBAYAR]
                  │
       (Penjual Input Estimasi & Klik Masak)
                  │
                  ▼
                MASAK
                  │
       (Makanan Selesai Dimasak)
                  │
                  ▼
              SIAP_AMBIL ──(Broadcast notifikasi ke mahasiswa)
                  │
       (Mahasiswa Tunjukkan Nomor Antrean di Loket)
                  │
                  ▼
              PICKED_UP (Pesanan selesai diambil di loket)
```

### C. Siklus Tiket Komplain (Complaint Lifecycle)
```
User Buat Tiket ──> BARU ──[Admin Buka & Balas]──> DIPROSES ──[Solusi Diterapkan]──> SELESAI
```

---

## 4. Resolusi Asumsi & Ketentuan Bisnis Khusus

1. **Format Nomor Antrean:**
   - Format: `[KODE_LOKET]-[3_DIGIT_ANGKA]` (Contoh: Loket A menghasilkan `A-001`, `A-002`, dst).
   - Counter nomor antrean di-reset otomatis menjadi 1 setiap pergantian hari (pukul 00:00 WIB).
2. **Algoritma Bestseller:**
   - Menu diberi label `BESTSELLER` jika masuk dalam 3 menu dengan jumlah terjual (`sold_count`) tertinggi di loket tersebut dalam 30 hari terakhir (minimal terjual 10 porsi).
3. **Pembayaran Tunai:**
   - Pada metode Tunai, pembeli tetap diwajibkan mengunggah foto komitmen (misalnya foto KTM UPNVJ atau foto kartu identitas mahasiswa) untuk meminimalisir risiko order fiktif.
4. **Pembatalan Pesanan:**
   - Mahasiswa **TIDAK DAPAT** membatalkan pesanan secara sepihak setelah pesanan masuk ke tahap `MASAK`.
   - Hanya penjual yang berhak membatalkan pesanan pada tahap `ANTRIAN` apabila bukti pembayaran terbukti tidak valid atau bahan baku habis tiba-tiba.
