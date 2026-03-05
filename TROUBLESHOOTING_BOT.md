## 🔧 Troubleshooting - WhatsApp Bot QR Code Loop

### Masalah: QR Code terus loop generate

**Penyebab:**
1. QR code belum di-scan
2. Scan timeout (belum scan dalam waktu 30-45 detik)
3. Session corrupted dari jalankan sebelumnya
4. Chrome/Chromium tidak kompatibel

---

### ✅ Solusi (Ikuti Urutan)

#### **Solusi 1: Bersihkan Session Lama (Paling Sering Berhasil)**

1. **Stop bot** (tekan Ctrl+C)

2. **Hapus folder session:**
   ```powershell
   # Windows PowerShell
   Remove-Item -Path ".\.wwebjs_auth" -Recurse -Force
   ```

3. **Hapus .env session (opsional):**
   - Edit `.env`
   - Ubah: `WHATSAPP_SESSION_NAME=whatsapp-session`
   - Menjadi: `WHATSAPP_SESSION_NAME=whatsapp-session-v2`

4. **Jalankan bot lagi:**
   ```bash
   npm run bot
   ```

5. **SEGERA scan QR code** yang muncul dengan WhatsApp smartphone Anda dalam 30 detik

---

#### **Solusi 2: Update Node.js & Puppeteer**

QR loop sering karena browser automation issue. Update dependencies:

```bash
npm update
npm install --save whatsapp-web.js@latest
```

Setelah install:
```bash
npm run bot
```

---

#### **Solusi 3: Explicit Chromium Path**

Jika Solusi 1 & 2 tidak berhasil, edit `bot_sekolah.js`:

Cari baris ini:
```javascript
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_SESSION_NAME || 'whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});
```

Tambahkan path ke Chromium (Windows):
```javascript
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_SESSION_NAME || 'whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'  // Sesuaikan path
    }
});
```

---

#### **Solusi 4: Gunakan Port Berbeda di Browser**

Jika port sudah dipakai:

1. Stop semua terminal

2. Edit `.env`:
   ```
   PORT=3001
   ```

3. Start API dengan port baru:
   ```bash
   npm start
   ```

4. Update API_URL di `dashboard.html` (jika perlu):
   ```javascript
   const API_URL = 'http://localhost:3001';
   ```

---

#### **Solusi 5: Gunakan Linux/WSL**

Jika Windows terus bermasalah, gunakan **WSL (Windows Subsystem for Linux)**:

```bash
# Install WSL2
wsl --install -d Ubuntu

# Di WSL terminal
cd /mnt/d/repo/SmartCardProject
npm run bot
```

---

### 🎯 Tanda Sukses

**Ketika bot berhasil:**

```
[BOT] Memulai WhatsApp Bot...
[BOT] Jika session belum ada, siapkan WhatsApp Anda untuk scan QR code.

[QR CODE] Scan QR code ini dengan WhatsApp Anda:

█████████████████████████
█ ▄▄▄▄▄ █ ▄▀ ▀ █ ▄▄▄▄▄ █
█ █   █ █▀▀ ▀▄█ █   █ █
█ █ ▄ █ █ ▀██ ▀ █ ▄ █ █
█ █▄█ █ █ ▀██  █ █▄█ █ █
█ ▄▄▄▄▄ █▀▀▄▀ ▀ ▄▄▄▄▄ █
█ ▄ ▀ ▀▄▀▀▀ ▀▀ ▀ ▀ ▀▄
█████████████████████████

[QR CODE] Jika QR tidak berubah selama 30 detik, tutup terminal dan jalankan ulang.

[BOT] ✅ WhatsApp Bot Berhasil Terhubung!
[BOT] Session tersimpan - tidak perlu scan QR lagi next time

[BOT] Listening untuk pesan masuk...

[DB] ✅ Database connected

[MONITORING] ✅ Presence monitoring dimulai
```

---

### 📱 Testing Bot (Setelah Berhasil Connect)

1. **Buka WhatsApp di smartphone**

2. **Chat ke bot dengan command:**
   ```
   /bantuan
   ```

3. **Seharusnya bot reply:**
   ```
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

4. **Test status command:**
   ```
   /status 1234567890
   ```

   Seharusnya reply:
   ```
   📋 DATA SISWA
   Nama: Budi Santoso
   NISN: 1234567890
   Kelas: X A

   📌 PRESENSI HARI INI
   Status: Belum Hadir

   ⚠️ POIN PELANGGARAN: 0
   ```

**Test greeting command:**
   ```
   /halo
   ```

   Seharusnya reply:
   ```
   Halo! 👋
   Saya adalah Bot Smart Card Sekolah.

   Ketik: */bantuan* untuk melihat perintah yang tersedia.
   ```

**Test pesan biasa (tidak akan reply):**
   ```
   Halo bot
   Apa kabar?
   Test test
   ```

   Bot **TIDAK AKAN REPLY** ke pesan biasa ini.

---

## 🚨 Masalah: Bot Merespon di Grup WhatsApp

### **Gejala:**
- Bot reply ke semua pesan di grup
- Spam notifikasi ke anggota grup
- Bot tidak bisa dibedakan chat pribadi vs grup

### **Penyebab:**
1. **Nomor pribadi** digunakan untuk bot (bukan nomor khusus)
2. Nomor pribadi sudah ada di banyak grup
3. Pengecekan grup tidak sempurna

### ✅ **Solusi Cepat:**

#### **Opsi 1: Ganti ke Nomor Khusus (REKOMENDASI)**
```bash
# 1. Stop bot (Ctrl+C)

# 2. Hapus session lama
Remove-Item -Path ".\.wwebjs_auth" -Recurse -Force

# 3. Setup nomor WhatsApp Business baru
#    - Download WhatsApp Business
#    - Gunakan nomor baru/khusus

# 4. Jalankan bot lagi
npm run bot

# 5. Scan QR dengan nomor baru
```

#### **Opsi 2: Tingkatkan Pengecekan Grup (Temporary)**
Edit `bot_sekolah.js`, ganti:
```javascript
// Dari:
if (message.isGroupMsg) return;

// Menjadi:
if (message.from.includes('@g.us') || message.isGroupMsg === true) {
    console.log(`[IGNORE] Pesan dari grup ${message.from}: "${message.body}"`);
    return;
}
```

### 📋 **Panduan Lengkap:**
👉 **[WHATSAPP_NUMBER_GUIDE.md](WHATSAPP_NUMBER_GUIDE.md)** - Panduan lengkap nomor pribadi vs khusus

---

### 🔍 Debug: Lihat Log Lebih Detail

Jika masih bermasalah, aktifkan debug mode:

Edit `bot_sekolah.js`, tambahkan:
```javascript
// Di atas client.on('qr'...)
client.on('loading_screen', (percent, message) => {
    console.log(`[LOADING] ${percent}% - ${message}`);
});
```

Jalankan:
```bash
npm run bot
```

Ini akan menunjukkan detail proses loading.

---

### 📋 Checklist Troubleshooting

- [ ] Hapus `.wwebjs_auth` folder
- [ ] Ubah `WHATSAPP_SESSION_NAME` di `.env`
- [ ] Update npm packages: `npm update`
- [ ] Check Node.js version: `node --version` (min v14)
- [ ] Pastikan WhatsApp sudah update ke versi terbaru
- [ ] Coba di device WhatsApp lain
- [ ] Check internet connection (wajib stabil)
- [ ] Jika Windows, coba restart komputer

---

### ⚠️ Jika Tetap Tidak Berhasil

1. **Cek error log lengkap:**
   ```powershell
   npm run bot 2>&1 | Tee-Object -FilePath bot_debug.log
   ```

2. **Lihat isi `bot_debug.log`** - cari error message

3. **Report dengan info:**
   - Windows/Linux version
   - Node.js version
   - npm version
   - Full error message dari log

---

### 🆘 Quick Emergency Fix

Jika urgently butuh bot jalan, jangan gunakan bot untuk notifikasi. Gunakan:
- Manual WhatsApp (admin kirim message manual)
- SMS gateway (implementasi di server_api.js)
- Email notification (lebih reliable)

---

**Update:** Bot sudah diimprove dengan better error handling & logging.  
Kalau masih loop, coba Solusi 1 dulu (bersihkan session lama).
