## 🚀 Quick Start Guide - SmartCardProject

### 5 Langkah Cepat Setup

#### **Langkah 1: Setup Database** (1 menit)
```bash
# Buka MySQL CLI atau phpMyAdmin
# Buat database baru bernama: db_smart_card
# Import schema:
mysql -u root -p db_smart_card < database_schema.sql
```

#### **Langkah 2: Install Dependencies** (2 menit)
```bash
npm install
```
atau double-click `setup.bat` (Windows)

#### **Langkah 3: Jalankan API Server** 
```bash
npm start
```
atau double-click `start_server.bat`

Output:
```
[DB] ✅ Berhasil terhubung ke MySQL: db_smart_card
[SERVER] API Smart Card berjalan di http://localhost:3000
```

#### **Langkah 4: Jalankan WhatsApp Bot** (Terminal baru)
```bash
npm run bot
```
atau double-click `start_bot.bat`

Scan QR code dengan WhatsApp

#### **Langkah 5: Buka Dashboard**
- File: `dashboard.html`
- atau: `file:///D:/repo/SmartCardProject/dashboard.html`

---

### 🎯 Testing Cepat

**Test Scan Kartu:**
1. Buka dashboard → Tab "Scan Kartu"
2. Input NISN: `1234567890`
3. Klik "Scan Kartu"
4. Hasilnya akan muncul (sample data dari database)

**Test Presensi:**
1. Tab "Presensi Harian" → Klik "Filter"
2. Lihat data presensi hari ini

**Test WhatsApp Bot:**
1. Chat nomor WhatsApp Anda sendiri ke bot
2. Ketik `/bantuan`
3. Bot akan reply dengan daftar perintah

---

### ⚠️ Common Issues & Quick Fix

| Error | Solusi |
|-------|--------|
| "Gagal konek database" | Check `.env` DB credentials |
| "CORS error di dashboard" | Pastikan API server running |
| "Port 3000 sudah dipakai" | Ubah PORT di `.env` |
| "Bot tidak scan QR" | Pastikan sudah jalan `npm run bot` |

---

### 📁 File Penting

- **server_api.js** - Backend (PORT 3000)
- **bot_sekolah.js** - WhatsApp Bot
- **dashboard.html** - UI untuk admin
- **database_schema.sql** - Database setup
- **.env** - Konfigurasi

---

### 🔗 API URL

```
http://localhost:3000/api/scan-gerbang    (POST)
http://localhost:3000/api/profil/:nisn    (GET)
http://localhost:3000/api/presensi        (GET)
http://localhost:3000/api/stats/presensi  (GET)
```

---

### 📱 Test Data (Sudah Ada)

Siswa:
- NISN: 1234567890 (Budi Santoso)
- NISN: 1234567891 (Siti Nurhaliza)
- NISN: 1234567892 (Ahmad Wijaya)

Buku:
- Laskar Pelangi
- Filosofi Teras
- Ayah

---

**Siap? Mari mulai! 🎉**

Untuk detail lebih lanjut, baca `README.md`
