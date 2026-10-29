# 03 — Arsitektur Sistem & Database (PostgreSQL + Prisma)

> **Ringkasan Teknis:**  
> VetaBite dibangun menggunakan **Next.js (App Router) + TypeScript**, dengan **Prisma ORM** di atas database **PostgreSQL**. Autentikasi berbasis session cookie `httpOnly` dengan hashing password `argon2` / `bcrypt`. Real-time event disalurkan melalui **Server-Sent Events (SSE)**.

---

## 1. Struktur Folder Proyek (Next.js App Router)

```
vetabite-app/
├── prisma/
│   ├── schema.prisma              # Skema lengkap PostgreSQL
│   └── seed.ts                    # Seeding 1 Admin, 3 Kantin, 10 Menu, 2 Mahasiswa
├── public/
│   ├── images/                    # Asset gambar publik / logo UPNVJ
│   └── uploads/                   # Folder upload lokal bukti bayar & avatar (atau S3)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Layar Login (Faiz)
│   │   │   ├── register/page.tsx  # Layar Registrasi Multi-Role (Faiz)
│   │   │   └── pending-verification/page.tsx # Layar Menunggu ACC Penjual (Faiz)
│   │   ├── (mahasiswa)/
│   │   │   ├── layout.tsx         # Layout dengan Floating Bottom Dock
│   │   │   ├── dashboard/page.tsx # Dashboard Utama Mahasiswa (Doniska)
│   │   │   ├── search/page.tsx    # Halaman Hasil Pencarian & Riwayat (Faiz)
│   │   │   ├── kantin/[id]/page.tsx # Detail Loket Kantin & Katalog Menu (Melvern)
│   │   │   ├── keranjang/page.tsx # Keranjang & Gate Bukti Bayar (Agit)
│   │   │   ├── pesanan/[id]/page.tsx # Pelacakan Status Antrean Real-time (Agit)
│   │   │   ├── riwayat/page.tsx   # Riwayat Pemesanan Mahasiswa (Doniska)
│   │   │   └── profil/page.tsx    # Manage Account, Ganti Password & Tema (Doniska)
│   │   ├── (penjual)/
│   │   │   ├── layout.tsx         # Layout Navigasi Penjual
│   │   │   ├── seller/pesanan/page.tsx # Pesanan Masuk Real-time (Melvern & Agit)
│   │   │   ├── seller/status-toko/page.tsx # Buka/Tutup & Manajemen Menu (Doniska)
│   │   │   ├── seller/statistika/page.tsx # Laporan Penjualan & Menu Terlaris (Fase Akhir)
│   │   │   └── seller/banned/page.tsx # Blacklist / Banned User (Fase Akhir)
│   │   ├── (admin)/
│   │   │   ├── layout.tsx         # Layout Sidebar Kaca Desktop 1440px
│   │   │   ├── admin/verifikasi/page.tsx # ACC / Tolak Pendaftaran Kantin (Admin)
│   │   │   ├── admin/stats/page.tsx # Statistika Pemakaian Platform (Admin)
│   │   │   └── admin/komplain/page.tsx # Pusat Resolusi Tiket Komplain (Admin)
│   │   ├── api/                   # Route Handlers REST API & SSE
│   │   ├── globals.css            # Token CSS & Liquid Glass Primitives
│   │   └── layout.tsx             # Root layout (Plus Jakarta Sans & Theme Provider)
│   ├── components/
│   │   ├── ui/                    # Glass Button, Glass Card, Modal, Input, Badge
│   │   ├── icons/                 # Komponen Icon SVG seragam
│   │   └── shared/                # Navbar, BottomDock, ToastNotification
│   ├── lib/
│   │   ├── prisma.ts              # Prisma Client singleton
│   │   ├── auth.ts                # Session cookie & password hashing
│   │   ├── rbac.ts                # Middleware guard helper
│   │   ├── sse.ts                 # Server-Sent Events broker
│   │   └── upload.ts              # Validasi MIME 5MB & storage handler
│   └── messages/
│       ├── id.json                # Bahasa Indonesia (Default)
│       └── en.json                # English
├── middleware.ts                  # Next.js Middleware untuk RBAC Route Protection
└── tailwind.config.ts
```

---

## 2. Skema Lengkap Database Prisma (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
enum Role {
  MAHASISWA
  PENJUAL
  ADMIN
}

enum AccountStatus {
  ACTIVE
  PENDING
  REJECTED
  INACTIVE
}

enum PaymentMethod {
  QRIS
  TUNAI
}

enum PaymentStatus {
  BELUM_DIBAYAR
  SUDAH_DIBAYAR
}

enum OrderStatus {
  ANTRIAN
  MASAK
  SIAP_AMBIL
  PICKED_UP
  DIBATALKAN
}

enum TicketStatus {
  BARU
  DIPROSES
  SELESAI
}

// -------------------------------------------------------------
// MODELS
// -------------------------------------------------------------

model User {
  id             String         @id @default(uuid())
  username       String         @unique
  password_hash  String
  full_name      String
  role           Role           @default(MAHASISWA)
  status         AccountStatus  @default(ACTIVE)
  avatar_url     String?
  language       String         @default("id") // "id" | "en"
  theme          String         @default("light") // "light" | "dark"
  whatsapp       String?
  reject_reason  String?        // Catatan alasan jika admin menolak pendaftaran
  
  // Relasi
  canteen        Canteen?       @relation("OwnerCanteen")
  orders         Order[]        @relation("BuyerOrders")
  search_history SearchHistory[]
  favorites      Favorite[]
  banned_records CanteenBan[]   @relation("BannedUser")
  complaints     Complaint[]    @relation("UserComplaints")
  messages       ComplaintMessage[]

  created_at     DateTime       @default(now())
  updated_at     DateTime       @updatedAt

  @@index([username])
  @@index([role, status])
}

model Canteen {
  id              String       @id @default(uuid())
  owner_id        String       @unique
  owner           User         @relation("OwnerCanteen", fields: [owner_id], references: [id], onDelete: Cascade)
  name            String       // Nama Loket (misal: "Kantin Barokah Mba Siti")
  description     String?
  banner_url      String?
  qris_image_url  String?      // Gambar QRIS statis loket
  is_open         Boolean      @default(true)
  queue_prefix    String       @default("A") // Kode loket untuk antrean, mis: "A", "B"

  // Relasi
  menu_items      MenuItem[]
  orders          Order[]
  favorited_by    Favorite[]
  banned_users    CanteenBan[]
  complaints      Complaint[]

  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  @@index([is_open])
}

model MenuItem {
  id           String      @id @default(uuid())
  canteen_id   String
  canteen      Canteen     @relation(fields: [canteen_id], references: [id], onDelete: Cascade)
  name         String
  description  String?
  photo_url    String?
  price        Int         // Harga dalam Rupiah utuh (misal: 15000)
  category     String      @default("Makanan") // Makanan | Minuman | Camilan
  is_available Boolean     @default(true)      // True = Tersedia, False = Habis
  sold_count   Int         @default(0)         // Terjual kumulatif untuk hitung bestseller
  is_bestseller Boolean    @default(false)

  order_items  OrderItem[]

  created_at   DateTime    @default(now())
  updated_at   DateTime    @updatedAt

  @@index([canteen_id, is_available])
  @@index([canteen_id, category])
}

model Order {
  id                 String         @id @default(uuid())
  canteen_id         String
  canteen            Canteen        @relation(fields: [canteen_id], references: [id], onDelete: Restrict)
  buyer_id           String
  buyer              User           @relation("BuyerOrders", fields: [buyer_id], references: [id], onDelete: Restrict)
  
  queue_number       String         // Format: "A-012"
  total_price        Int            // Rupiah
  payment_method     PaymentMethod  @default(QRIS)
  payment_proof_url  String         // NOT NULL: Gate bukti bayar wajib
  payment_status     PaymentStatus  @default(BELUM_DIBAYAR)
  order_status       OrderStatus    @default(ANTRIAN)
  
  can_pickup         Boolean        @default(false)
  estimated_minutes  Int            @default(15) // Estimasi menit selesai masak
  
  ordered_at         DateTime       @default(now())
  picked_up_at       DateTime?
  
  // Relasi
  order_items        OrderItem[]
  complaints         Complaint[]

  created_at         DateTime       @default(now())
  updated_at         DateTime       @updatedAt

  @@index([canteen_id, ordered_at])
  @@index([buyer_id, ordered_at])
  @@index([order_status, payment_status])
}

model OrderItem {
  id             String    @id @default(uuid())
  order_id       String
  order          Order     @relation(fields: [order_id], references: [id], onDelete: Cascade)
  menu_item_id   String?
  menu_item      MenuItem? @relation(fields: [menu_item_id], references: [id], onDelete: SetNull)
  
  // Snapshot data agar riwayat pesanan tidak berubah saat penjual edit menu
  name_snapshot  String
  price_snapshot Int
  qty            Int       @default(1)
  note           String?   // Catatan khusus per menu ("Pedas sedang", dll)

  created_at     DateTime  @default(now())
}

model CanteenBan {
  id          String   @id @default(uuid())
  canteen_id  String
  canteen     Canteen  @relation(fields: [canteen_id], references: [id], onDelete: Cascade)
  user_id     String
  user        User     @relation("BannedUser", fields: [user_id], references: [id], onDelete: Cascade)
  
  reason      String   // Alasan: "Bukti transfer palsu", "Ghosting pesanan tunai", dll
  note        String?  // Catatan detail dari penjual
  created_at  DateTime @default(now())

  @@unique([canteen_id, user_id]) // Satu kantin hanya bisa memblokir user satu kali
  @@index([canteen_id])
}

model Favorite {
  user_id     String
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  canteen_id  String
  canteen     Canteen  @relation(fields: [canteen_id], references: [id], onDelete: Cascade)
  created_at  DateTime @default(now())

  @@id([user_id, canteen_id])
}

model SearchHistory {
  id         String   @id @default(uuid())
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  keyword    String
  created_at DateTime @default(now())

  @@index([user_id, created_at])
}

model Complaint {
  id             String             @id @default(uuid())
  reporter_id    String
  reporter       User               @relation("UserComplaints", fields: [reporter_id], references: [id], onDelete: Cascade)
  reporter_role  Role
  canteen_id     String?
  canteen        Canteen?           @relation(fields: [canteen_id], references: [id], onDelete: SetNull)
  order_id       String?
  order          Order?             @relation(fields: [order_id], references: [id], onDelete: SetNull)
  
  subject        String             // "Makanan tidak sesuai", "Pesanan lama", dll
  body           String
  attachment_url String?
  status         TicketStatus       @default(BARU)
  
  messages       ComplaintMessage[]

  created_at     DateTime           @default(now())
  updated_at     DateTime           @updatedAt

  @@index([status, created_at])
}

model ComplaintMessage {
  id            String    @id @default(uuid())
  complaint_id  String
  complaint     Complaint @relation(fields: [complaint_id], references: [id], onDelete: Cascade)
  author_id     String
  author        User      @relation(fields: [author_id], references: [id], onDelete: Cascade)
  body          String
  created_at    DateTime  @default(now())
}
```

---

## 3. Middleware RBAC (`middleware.ts`)

Aturan pembatasan akses di gerbang aplikasi:

1. **Route Publik:**
   - `/`, `/login`, `/register`, `/api/auth/*`
2. **Route Mahasiswa (`/dashboard`, `/kantin/*`, `/keranjang`, `/pesanan/*`, `/riwayat`, `/profil`, `/search`):**
   - Wajib memiliki session aktif dengan role `MAHASISWA`.
   - Jika role `PENJUAL`, redirect ke `/seller/pesanan`.
   - Jika role `ADMIN`, redirect ke `/admin/verifikasi`.
3. **Route Penjual (`/seller/*`):**
   - Wajib memiliki session aktif dengan role `PENJUAL`.
   - Jika status pendaftarannya masih `PENDING`, redirect ke `/pending-verification`.
   - Jika status `REJECTED` atau `INACTIVE`, tampilkan halaman status penolakan.
4. **Route Admin (`/admin/*`):**
   - Wajib memiliki session aktif dengan role `ADMIN`.
   - Role lain yang mencoba mengakses dilempar ke halaman 403 Forbidden.

---

## 4. Kanal Server-Sent Events (SSE Real-Time)

Untuk mengalirkan data tanpa refresh halaman:
* `GET /api/sse/canteen/:canteenId` -> Broadcast pesanan baru masuk ke penjual & pembaruan ketersediaan menu ke pembeli.
* `GET /api/sse/order/:orderId` -> Broadcast perubahan status pesanan (`ANTRIAN` -> `MASAK` -> `SIAP_AMBIL`) ke mahasiswa.
