# 📱 SmartCardProject - Dokumentasi Lengkap

## 📋 Daftar Isi
1. [Setup Awal](#setup-awal)
2. [Struktur File](#struktur-file)
3. [API Documentation](#api-documentation)
4. [WhatsApp Bot](#whatsapp-bot)
5. [Dashboard Usage](#dashboard-usage)
6. [Troubleshooting](#troubleshooting)
7. [Bot QR Loop Troubleshooting](TROUBLESHOOTING_BOT.md) ⚠️ **BACA JIKA ADA MASALAH BOT**
8. [Panduan Nomor WhatsApp](WHATSAPP_NUMBER_GUIDE.md) 📱 **PENTING: Nomor Pribadi vs Khusus**

---

## 🚀 Setup Awal

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
1. Buka MySQL/phpMyAdmin
2. Buat database baru: `db_smart_card`
3. Import file SQL:
```bash
mysql -u root -p db_smart_card < database_schema.sql
```

### 3. Konfigurasi .env
File `.env` sudah dibuat dengan default:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_smart_card
PORT=3000
WHATSAPP_SESSION_NAME=whatsapp-session
SEND_NOTIF_TERLAMBAT=true
```
**Sesuaikan dengan konfigurasi MySQL Anda!**

### 4. Jalankan Aplikasi

**Terminal 1 - Backend API:**
```bash
node server_api.js
```
Output:
```
[DB] ✅ Berhasil terhubung ke MySQL: db_smart_card
[SERVER] API Smart Card berjalan di http://localhost:3000
```

**Terminal 2 - WhatsApp Bot:**
```bash
node bot_sekolah.js
```
Output:
```
[BOT] Starting WhatsApp Bot...
[QR CODE] Scan QR code ini dengan WhatsApp:
```
Scan dengan WhatsApp pertama kali untuk setup.

### 5. Akses Dashboard
Buka browser: `file:///D:/repo/SmartCardProject/dashboard.html`

---

## 📁 Struktur File

```
SmartCardProject/
├── .env                    # Konfigurasi environment
├── server_api.js           # Backend Express API
├── bot_sekolah.js          # WhatsApp Bot
├── dashboard.html          # Frontend Dashboard
├── database_schema.sql     # Database schema & sample data
├── package.json            # Dependencies
├── README.md               # Dokumentasi ini
└── node_modules/           # Dependencies folder
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. **POST /api/scan-gerbang**
Scan kartu siswa di gerbang untuk presensi

**Request:**
```json
{
  "nisn": "1234567890"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Presensi berhasil dicatat.",
  "data": {
    "nisn": "1234567890",
    "nama": "Budi Santoso",
    "kelas": "X A",
    "foto": null,
    "terlambat": false,
    "waktu_scan": "08:15:30"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Kartu Tidak Dikenali / Siswa Tidak Aktif"
}
```

---

#### 2. **GET /api/profil/:nisn**
Ambil profil lengkap siswa

**Request:**
```
GET http://localhost:3000/api/profil/1234567890
```

**Response:**
```json
{
  "success": true,
  "message": "Profil siswa ditemukan",
  "data": {
    "nisn": "1234567890",
    "nama_lengkap": "Budi Santoso",
    "kelas": "X A",
    "no_hp_ortu": "081234567890",
    "foto_profil": null,
    "total_poin": 5,
    "pinjaman_aktif": [
      {
        "judul_buku": "Laskar Pelangi",
        "tgl_tenggat": "2025-03-15"
      }
    ],
    "presensi_hari_ini": {
      "waktu_scan": "2025-03-05T08:15:30.000Z",
      "status_kehadiran": "Hadir"
    }
  }
}
```

---

#### 3. **GET /api/presensi**
List presensi dengan filter

**Request:**
```
GET http://localhost:3000/api/presensi?tanggal=2025-03-05&nisn=1234567890
```

**Query Parameters:**
- `tanggal` (optional) - Format: YYYY-MM-DD
- `nisn` (optional) - NISN siswa

**Response:**
```json
{
  "success": true,
  "message": "Total presensi: 10",
  "data": [
    {
      "nisn": "1234567890",
      "nama_lengkap": "Budi Santoso",
      "kelas": "X A",
      "waktu_scan": "2025-03-05T08:15:30.000Z",
      "status_kehadiran": "Hadir"
    }
  ]
}
```

---

#### 4. **GET /api/stats/presensi**
Statistik presensi per bulan

**Request:**
```
GET http://localhost:3000/api/stats/presensi?bulan=03&tahun=2025
```

**Query Parameters:**
- `bulan` - 1-12 (default: 3)
- `tahun` - 4 digit tahun (default: 2025)

**Response:**
```json
{
  "success": true,
  "message": "Statistik presensi bulan 03/2025",
  "data": [
    {
      "nisn": "1234567890",
      "nama_lengkap": "Budi Santoso",
      "kelas": "X A",
      "hadir": 15,
      "terlambat": 2,
      "izin": 1,
      "sakit": 0,
      "total": 18
    }
  ]
}
```

---

## 🤖 WhatsApp Bot

### Fitur Bot

#### 1. **Notifikasi Keterlambatan (Otomatis)**
Ketika siswa terlambat scan kartu:
```
🎓 NOTIFIKASI SMART CARD SEKOLAH

Anak Anda Budi Santoso (1234567890) TERLAMBAT masuk sekolah.

Waktu masuk: 08:15:30
⏰ Harap segera hubungi sekolah jika ada masalah.

_Pesan otomatis dari sistem Smart Card_
```

#### 2. **Perintah Bot**

**`/status [NISN]`** - Lihat data siswa dan presensi
```
/status 1234567890

Balasan:
📋 DATA SISWA
Nama: Budi Santoso
NISN: 1234567890
Kelas: X A

📌 PRESENSI HARI INI
Status: Belum Hadir

⚠️ POIN PELANGGARAN: 0
```

**`/bantuan`** - Tampilkan bantuan perintah
```
/bantuan

Balasan:
🤖 BOT SMART CARD SEKOLAH

📋 PERINTAH YANG TERSEDIA:

/status [NISN]
  → Lihat data & presensi siswa
  Contoh: /status 1234567890

/bantuan
  → Tampilkan bantuan ini

ℹ️ NOTIFIKASI OTOMATIS:
  🔴 Siswa terlambat
  ⚠️ Ada pelanggaran
  📚 Buku harus dikembalikan
```

**`/halo`** atau **`/hi`** - Greeting
```
/halo

Balasan:
Halo! 👋
Saya adalah Bot Smart Card Sekolah.

Ketik: */bantuan* untuk melihat perintah yang tersedia.
```

**`/test`** - Test bot aktif
```
/test

Balasan:
✅ Bot Smart Card aktif dan berjalan dengan baik!

Ketik */bantuan* untuk melihat semua perintah.
```

**Pesan Biasa** - Bot tidak akan reply
```
Halo bot
Apa kabar?
Test test

Bot TIDAK AKAN REPLY ke pesan biasa ini.
```

---

## 🎯 Dashboard Usage

### Tab 1: Scan Kartu
1. Input atau scan NISN
2. Klik "🔍 Scan Kartu" atau tekan Enter
3. Lihat profil siswa + status presensi

### Tab 2: Presensi Harian
1. Pilih tanggal (default: hari ini)
2. (Optional) Filter NISN
3. Klik "🔍 Filter"
4. Lihat list presensi dalam tabel

### Tab 3: Statistik
1. Pilih bulan dan tahun
2. Klik "📊 Tampilkan"
3. Lihat stat card (Total Hadir, Terlambat, dll)
4. Lihat detail per siswa dalam tabel

### Tab 4: Profil Siswa
1. Input NISN
2. Klik "🔍 Cari Profil"
3. Lihat profil lengkap:
   - Data siswa
   - Poin pelanggaran
   - Buku pinjaman
   - Presensi hari ini

---

## 🔧 Database Tables

### `tbl_siswa`
Master data siswa
```sql
- nisn (PK)
- nama_lengkap
- kelas
- no_hp_ortu
- email_ortu
- foto_profil
- status_aktif
```

### `tbl_presensi`
Catatan presensi harian
```sql
- id_presensi (PK)
- nisn (FK)
- waktu_scan
- status_kehadiran (Hadir/Terlambat/Izin/Sakit)
- keterangan
```

### `tbl_pelanggaran`
Catatan pelanggaran siswa
```sql
- id_pelanggaran (PK)
- nisn (FK)
- jenis_pelanggaran
- deskripsi
- poin_sanksi
- tanggal_pelanggaran
```

### `tbl_peminjaman`
Catatan peminjaman buku
```sql
- id_peminjaman (PK)
- nisn (FK)
- kode_buku (FK)
- tgl_pinjam
- tgl_tenggat
- tgl_kembali
- status_pinjam (Dipinjam/Dikembalikan/Hilang)
- denda
```

### `tbl_buku`
Katalog buku perpustakaan
```sql
- kode_buku (PK)
- judul_buku
- pengarang
- penerbit
- tahun_terbit
- isbn
- stok_tersedia
- stok_total
```

### `tbl_notifikasi`
Log notifikasi WhatsApp
```sql
- id_notifikasi (PK)
- nisn (FK)
- no_hp_tujuan
- tipe_notifikasi
- isi_pesan
- status_kirim
- waktu_kirim
```

---

## 🐛 Troubleshooting

### Error: "Gagal konek ke database"
- **Solusi:** 
  - Pastikan MySQL running
  - Check `.env` DB_HOST, DB_USER, DB_PASSWORD
  - Pastikan database `db_smart_card` sudah dibuat

### Error: "CORS blocked"
- **Solusi:** 
  - Pastikan `server_api.js` sudah running di port 3000
  - Check API_URL di dashboard.html

### Error: "Port 3000 sudah dipakai"
- **Solusi:** 
  - Ubah PORT di `.env` (misal: 3001)
  - Atau kill process yang pakai port 3000:
  ```bash
  # Windows PowerShell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### WhatsApp Bot tidak mengirim notifikasi
- **Solusi:**
  - Pastikan sudah scan QR code
  - Check setting: `SEND_NOTIF_TERLAMBAT=true` di `.env`
  - Pastikan nomor HP format benar (62xxxxxxxxxx)
  - Check log di terminal bot

### Dashboard tidak bisa konek API
- **Solusi:**
  - Buka browser console (F12)
  - Check error message
  - Pastikan `server_api.js` running
  - Ubah `localhost` ke `127.0.0.1` jika perlu

---

## 📝 Sample Data

Database sudah include sample data:
- **3 Siswa** (NISN: 1234567890-1234567892)
- **3 Buku** (Laskar Pelangi, Filosofi Teras, Ayah)
- Siap untuk testing

---

## 🆘 Troubleshooting Bot QR Loop

**Masalah:** Bot terus generate QR code tanpa pernah connect

**Solusi Cepat:**
1. Stop bot (Ctrl+C)
2. Hapus folder `.wwebjs_auth`
3. Jalankan: `npm run bot`
4. Scan QR dalam 30 detik

**Untuk detail lengkap:**
👉 [Baca TROUBLESHOOTING_BOT.md](TROUBLESHOOTING_BOT.md)

---

## 🚀 Next Steps (Fitur Tambahan)

1. **Authentication** - Login admin/guru
2. **Mobile App** - React Native atau Flutter
3. **QR Code Generator** - Generate kartu siswa
4. **Analytics Dashboard** - Chart & graph
5. **SMS Notification** - Fallback jika WhatsApp gagal
6. **Email Notification** - Report mingguan ke ortu
7. **Multi-School Support** - Database per sekolah

---

## 📞 Support

Jika ada pertanyaan atau error, check:
1. Terminal console output
2. Browser console (F12 → Console tab)
3. Database tabel `tbl_notifikasi` untuk log
4. [TROUBLESHOOTING_BOT.md](TROUBLESHOOTING_BOT.md) untuk bot issues
5. [WHATSAPP_NUMBER_GUIDE.md](WHATSAPP_NUMBER_GUIDE.md) untuk masalah nomor WhatsApp

---

**Version:** 1.0.3 (Group Message Fix + Number Management)  
**Last Updated:** March 5, 2026  
**Author:** SmartCard Development Team
