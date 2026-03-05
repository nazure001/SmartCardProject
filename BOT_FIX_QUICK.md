## 🆘 QUICK FIX - Bot QR Loop

### Masalah Anda
```
Bot terus generate QR code
Scan tidak terjadi apapun
Loop terus menerus
```

---

### ✅ FIX (3 Langkah Simple)

#### **Langkah 1: Stop Bot**
```
Tekan: Ctrl + C
```

#### **Langkah 2: Bersihkan Session**
```powershell
# Windows PowerShell (jalankan di project folder)
Remove-Item -Path ".\.wwebjs_auth" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "whatsapp-session" -Recurse -Force -ErrorAction SilentlyContinue
```

Atau manual:
- Buka Explorer
- Cari folder `.wwebjs_auth` (hidden folder)
- Hapus folder tersebut

#### **Langkah 3: Jalankan Ulang**
```bash
npm run bot
```

---

### 🎯 Yang Akan Terlihat (Normal)

```
[BOT] Memulai WhatsApp Bot...

[QR CODE] Scan QR code ini dengan WhatsApp Anda:

█████████████
█ [QR IMAGE] █
█████████████

[QR CODE] Jika QR tidak berubah selama 30 detik, tutup terminal dan jalankan ulang.
```

### ⏰ PENTING: Harus dalam 30 detik!

1. **Siapkan WhatsApp smartphone Anda**
2. **Buka Settings → Linked Devices**
3. **Tap "Link a Device"**
4. **Scan QR code yang muncul di terminal**
5. **Tunggu connect (10-20 detik)**

Jangan tunggu > 30 detik atau akan loop lagi!

---

### ✅ Tanda Berhasil

```
[BOT] ✅ WhatsApp Bot Berhasil Terhubung!
[BOT] Session tersimpan - tidak perlu scan QR lagi next time

[BOT] Listening untuk pesan masuk...

[DB] ✅ Database connected

[MONITORING] ✅ Presence monitoring dimulai
```

Selesai! Bot sudah ready.

---

### 🧪 Test Bot

Chat ke WhatsApp Anda sendiri:
```
/bantuan
```

Bot harus reply dengan daftar perintah.

---

### ⚠️ Jika Tetap Loop

1. **Update packages:**
   ```bash
   npm update
   ```

2. **Coba edit `.env`:**
   ```
   WHATSAPP_SESSION_NAME=whatsapp-session-new
   ```

3. **Restart Node.js:**
   - Tutup semua terminal
   - Buka terminal baru
   - `npm run bot`

---

### 🛠️ Untuk Detail Lengkap

Lihat: [TROUBLESHOOTING_BOT.md](TROUBLESHOOTING_BOT.md)

---

**Status:** Bot sudah di-improve dengan better error handling
