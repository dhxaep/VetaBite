# 04 — Spesifikasi API & Kontrak Real-Time (REST + SSE)

> **Standar Komunikasi:**  
> Seluruh endpoint berada di bawah prefix `/api`. Format request dan response menggunakan `application/json` (kecuali upload multipart).  
> Autentikasi menggunakan session cookie aman (`httpOnly`, `sameSite: "lax"`).

---

## 1. Format Standar Respons & Error Handling

### A. Format Sukses
```json
{
  "success": true,
  "data": { ... }
}
```

### B. Format Error (Wajib Bahasa Indonesia)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Bukti pembayaran wajib diunggah sebelum pesanan diproses."
  }
}
```

Kode Error Baku:
* `UNAUTHORIZED`: Belum login atau session kedaluwarsa.
* `FORBIDDEN`: Tidak memiliki hak akses role terhadap sumber daya ini.
* `VALIDATION_ERROR`: Input form tidak lolos validasi skema Zod.
* `PAYMENT_PROOF_REQUIRED`: Mencoba checkout tanpa menyertakan URL bukti pembayaran.
* `ITEM_OUT_OF_STOCK`: Salah satu menu yang dipesan telah berstatus Habis.
* `USER_BANNED_BY_CANTEEN`: Akun pembeli berada dalam daftar blokir loket kantin ini.
* `NOT_FOUND`: Data yang dicari tidak ditemukan.
* `SERVER_ERROR`: Kesalahan internal server.

---

## 2. Modul Autentikasi (`/api/auth`)

### 1. `POST /api/auth/register`
* **Akses:** Publik
* **Request Body:**
  ```json
  {
    "role": "MAHASISWA", // atau "PENJUAL"
    "full_name": "Ahmad Daffa",
    "username": "daffa_upnvj",
    "password": "Password123!",
    "whatsapp": "081234567890",
    // Field wajib KHUSUS PENJUAL:
    "canteen_name": "Kantin Barokah",
    "canteen_description": "Spesialis Ayam Geprek & Nasi Goreng"
  }
  ```
* **Response 201 Created:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-user",
      "username": "daffa_upnvj",
      "role": "MAHASISWA",
      "status": "ACTIVE" // atau "PENDING" jika PENJUAL
    }
  }
  ```

### 2. `POST /api/auth/login`
* **Akses:** Publik
* **Request Body:**
  ```json
  {
    "username": "daffa_upnvj",
    "password": "Password123!"
  }
  ```
* **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid-user",
        "username": "daffa_upnvj",
        "full_name": "Ahmad Daffa",
        "role": "MAHASISWA",
        "status": "ACTIVE"
      },
      "redirectTo": "/dashboard" // "/dashboard" | "/seller/pesanan" | "/admin/verifikasi" | "/pending-verification"
    }
  }
  ```

### 3. `POST /api/auth/logout`
* **Akses:** Login
* **Response 200 OK:** `{ "success": true, "message": "Berhasil keluar." }`

---

## 3. Modul Upload File (`/api/uploads`)

### `POST /api/uploads/payment-proof`
* **Akses:** Mahasiswa (Login)
* **Format:** `multipart/form-data` dengan field `file`.
* **Aturan Validasi Server:**
  1. Ukuran maksimum 5 MB (`5 * 1024 * 1024` bytes).
  2. Periksa Magic Bytes/MIME Type file asli: Hanya boleh `image/jpeg`, `image/png`, atau `image/webp`.
  3. Simpan file dengan nama acak: `proof-[uuid].[ext]`.
* **Response 201 Created:**
  ```json
  {
    "success": true,
    "data": {
      "fileUrl": "/uploads/proof-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.webp"
    }
  }
  ```

---

## 4. Modul Mahasiswa

### 1. `GET /api/canteens`
* **Query:** `?q=&category=&min_price=&max_price=&sort=rating`
* **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-canteen-1",
        "name": "Loket #01 — Warung Bu Siti",
        "description": "Ayam Geprek, Nasi Bakar, Es Jeruk Segar",
        "banner_url": "/images/canteen-1.jpg",
        "is_open": true,
        "avg_rating": 4.9,
        "rating_count": 142,
        "queue_prefix": "A",
        "estimated_wait_minutes": 10
      }
    ]
  }
  ```

### 2. `GET /api/canteens/:id`
* **Response 200 OK:** Detail loket kantin, info antrean, dan daftar menu terorganisir per kategori.
  ```json
  {
    "success": true,
    "data": {
      "canteen": { "id": "...", "name": "...", "is_open": true, "qris_image_url": "..." },
      "current_queue_count": 3,
      "estimated_minutes": 12,
      "categories": ["Semua", "Makanan", "Minuman", "Camilan"],
      "menu_items": [
        {
          "id": "uuid-menu-1",
          "name": "Paket Geprek Keju Lumer",
          "description": "Ayam krispi sambal korek dengan lelehan mozarella",
          "price": 18000,
          "category": "Makanan",
          "is_available": true,
          "is_bestseller": true,
          "photo_url": "/images/geprek.jpg"
        }
      ]
    }
  }
  ```

### 3. `POST /api/orders` (Checkout Pesanan)
* **Request Body:**
  ```json
  {
    "canteen_id": "uuid-canteen-1",
    "items": [
      { "menu_item_id": "uuid-menu-1", "qty": 2, "note": "Pedas level 3" }
    ],
    "payment_method": "QRIS",
    "payment_proof_url": "/uploads/proof-9b1deb4d.webp"
  }
  ```
* **Validasi Server:**
  - `payment_proof_url` wajib ada string tidak kosong.
  - Cek apakah user diblokir oleh kantin (`canteen_bans`).
  - Cek apakah kantin buka (`is_open = true`).
  - Cek apakah stok semua item `is_available = true`.
  - Buat nomor antrean harian transaksional (`A-012`).
* **Response 201 Created:**
  ```json
  {
    "success": true,
    "data": {
      "order_id": "uuid-order-1",
      "queue_number": "A-012",
      "order_status": "ANTRIAN",
      "payment_status": "BELUM_DIBAYAR",
      "total_price": 36000
    }
  }
  ```

---

## 5. Modul Penjual (`/api/seller/*`)

Semua endpoint terlindungi role `PENJUAL` dan dibatasi hanya pada kantin miliknya.

1. **`PATCH /api/seller/canteen`**: Mengubah status Buka/Tutup (`is_open`), banner, deskripsi, atau gambar QRIS.
2. **`GET /api/seller/orders`**: Mengambil daftar pesanan masuk hari ini (filter status: `ANTRIAN`, `MASAK`, `SIAP_AMBIL`).
3. **`PATCH /api/seller/orders/:id/verify-payment`**: Mengubah `payment_status` menjadi `SUDAH_DIBAYAR`.
4. **`PATCH /api/seller/orders/:id/status`**: 
   - Transisi status: `ANTRIAN` -> `MASAK` (wajib sudah bayar) -> `SIAP_AMBIL` -> `PICKED_UP`.
   - Dapat menyertakan `{ "estimated_minutes": 15 }`.
5. **`PATCH /api/seller/menu/:id/toggle-stock`**: Toggle instan ketersediaan menu (`is_available: true/false`).
6. **`POST /api/seller/bans`**: Memblokir pembeli (Body: `{ "user_id": "...", "reason": "Bukti palsu", "note": "..." }`).
7. **`DELETE /api/seller/bans/:userId`**: Membuka blokir pembeli (Unban).
8. **`GET /api/seller/stats?period=day|week|month`**: Pemasukan total, porsi terjual, menu terlaris.

---

## 6. Modul Admin (`/api/admin/*`)

Semua endpoint terlindungi role `ADMIN`.

1. **`GET /api/admin/canteens?status=PENDING|ACTIVE|REJECTED`**: Daftar akun kantin.
2. **`POST /api/admin/canteens/:id/approve`**: Menyetujui pendaftaran kantin (`PENDING` -> `ACTIVE`).
3. **`POST /api/admin/canteens/:id/reject`**: Menolak pendaftaran (Body: `{ "reason": "Dokumen loket tidak lengkap" }`).
4. **`PATCH /api/admin/canteens/:id/toggle-active`**: Menonaktifkan loket bermasalah.
5. **`GET /api/admin/stats`**: Total transaksi kampus, jam sibuk (peak hours), user aktif harian.
6. **`GET /api/admin/complaints` & `PATCH /api/admin/complaints/:id`**: Manajemen tiket komplain.

---

## 7. Format Server-Sent Events (SSE Real-Time)

### Endpoint SSE:
* Mahasiswa: `GET /api/sse/order/:orderId`
* Penjual: `GET /api/sse/canteen/:canteenId`

### Format Payload Event:
```json
// Event: order_update
{
  "event": "order_update",
  "data": {
    "order_id": "uuid-order-1",
    "order_status": "MASAK",
    "payment_status": "SUDAH_DIBAYAR",
    "can_pickup": false,
    "estimated_minutes": 8,
    "updated_at": "2026-10-28T22:30:00Z"
  }
}

// Event: new_order (untuk penjual)
{
  "event": "new_order",
  "data": {
    "order_id": "uuid-order-2",
    "queue_number": "A-013",
    "buyer_name": "Faiz R.",
    "total_price": 25000,
    "items_count": 2,
    "ordered_at": "2026-10-28T22:32:00Z"
  }
}
```
