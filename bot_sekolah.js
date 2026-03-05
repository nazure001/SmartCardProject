/**
 * ============================================================================
 * NAMA FILE: bot_sekolah.js
 * DESKRIPSI: WhatsApp Bot untuk notifikasi Smart Card (keterlambatan, pelanggaran, peminjaman)
 * CARA JALAN: node bot_sekolah.js
 * SETUP: Scan QR code dengan WhatsApp pertama kali
 * ============================================================================
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const mysql = require('mysql2/promise');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ==========================================
// DATABASE CONFIG
// ==========================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_smart_card'
};

let pool;

// ==========================================
// WHATSAPP CLIENT INITIALIZATION
// ==========================================
let qrShown = false;
let isInitialized = false;

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_SESSION_NAME || 'whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code generation - improved to prevent loop
client.on('qr', (qr) => {
    if (!qrShown) {
        qrShown = true;
        console.log('[QR CODE] Scan QR code ini dengan WhatsApp Anda:\n');
        qrcode.generate(qr, { small: true });
        console.log('\n[QR CODE] Jika QR tidak berubah selama 30 detik, tutup terminal dan jalankan ulang.\n');
    }
});

// Session ready
client.on('ready', async () => {
    if (isInitialized) return; // Prevent multiple initialization
    isInitialized = true;
    qrShown = false;
    
    console.log('\n[BOT] ✅ WhatsApp Bot Berhasil Terhubung!');
    console.log('[BOT] Session tersimpan - tidak perlu scan QR lagi next time\n');
    console.log('[BOT] Listening untuk pesan masuk...\n');
    
    // Inisialisasi database
    try {
        pool = mysql.createPool(dbConfig);
        console.log('[DB] ✅ Database connected\n');
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        process.exit(1);
    }

    // Mulai monitoring presensi untuk notifikasi
    startPresenceMonitoring();
});

// Authentication failure
client.on('auth_failure', (msg) => {
    console.error('\n[AUTH FAILED] Gagal authenticate WhatsApp');
    console.error('[AUTH FAILED]', msg);
    console.log('\n[INFO] Menghapus session yang rusak...');
    // Try to remove corrupted session
    const sessionPath = `.wwebjs_auth/session-${process.env.WHATSAPP_SESSION_NAME || 'whatsapp-session'}`;
    if (require('fs').existsSync(sessionPath)) {
        require('fs').rmSync(sessionPath, { recursive: true });
        console.log('[INFO] Session dihapus. Silakan jalankan ulang dan scan QR code.\n');
    }
});

// Disconnected
client.on('disconnected', (reason) => {
    console.log('\n[DISCONNECTED] WhatsApp disconnected:', reason);
    console.log('[INFO] Bot akan coba reconnect otomatis...\n');
    isInitialized = false;
    qrShown = false;
});

// Error handler
client.on('error', (err) => {
    console.error('[CLIENT ERROR]', err.message);
});

// Initialize client with error handling
(async () => {
    try {
        console.log('[BOT] Memulai WhatsApp Bot...');
        console.log('[BOT] Jika session belum ada, siapkan WhatsApp Anda untuk scan QR code.\n');
        await client.initialize();
    } catch (error) {
        console.error('[INIT ERROR]', error.message);
        console.log('\n[ERROR] Gagal inisialisasi bot. Silakan periksa:');
        console.log('  1. .env file sudah dikonfigurasi');
        console.log('  2. Node.js versi 14+');
        console.log('  3. Coba hapus folder .wwebjs_auth dan jalankan ulang\n');
        process.exit(1);
    }
})();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format nomor WhatsApp (62xxx ke format @c.us)
 */
function formatPhoneNumber(phone) {
    let formatted = phone.replace(/[^\d]/g, '');
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
    }
    return formatted + '@c.us';
}

/**
 * Send notifikasi ke WhatsApp (No HP Ortu)
 */
async function sendWhatsAppNotification(noHp, pesan, tipe = 'Umum') {
    try {
        if (!noHp) {
            console.log('[NOTIF] ⚠️ Nomor HP tidak valid, skip kirim notifikasi');
            return false;
        }

        const chatId = formatPhoneNumber(noHp);
        const formattedMessage = `🎓 *NOTIFIKASI SMART CARD SEKOLAH*\n\n${pesan}\n\n_Pesan otomatis dari sistem Smart Card_`;
        
        await client.sendMessage(chatId, formattedMessage);
        console.log(`[NOTIF] ✅ Pesan terkirim ke ${noHp}`);
        
        // Log ke database
        await logNotificationToDb(noHp, tipe, pesan, 'Terkirim');
        return true;

    } catch (error) {
        console.error(`[NOTIF ERROR] Gagal kirim ke ${noHp}:`, error.message);
        await logNotificationToDb(noHp, tipe, pesan, 'Gagal');
        return false;
    }
}

/**
 * Log notifikasi ke database
 */
async function logNotificationToDb(noHp, tipе, isiPesan, statusKirim) {
    try {
        if (!pool) return;
        
        await pool.query(
            'INSERT INTO tbl_notifikasi (no_hp_tujuan, tipe_notifikasi, isi_pesan, status_kirim, waktu_kirim) VALUES (?, ?, ?, ?, NOW())',
            [noHp, tipе, isiPesan, statusKirim]
        );
    } catch (error) {
        console.error('[LOG NOTIF ERROR]:', error.message);
    }
}

// ==========================================
// MONITORING & NOTIFICATION LOGIC
// ==========================================

/**
 * Monitor presensi untuk notifikasi keterlambatan
 * Jalankan setiap menit untuk cek siswa terbaru yang terlambat
 */
function startPresenceMonitoring() {
    setInterval(async () => {
        try {
            if (!pool) return;

            // Cek presensi terlambat dalam 5 menit terakhir
            const [terlambat] = await pool.query(`
                SELECT 
                    p.id_presensi,
                    s.nisn,
                    s.nama_lengkap,
                    s.no_hp_ortu,
                    p.waktu_scan,
                    p.status_kehadiran
                FROM tbl_presensi p
                JOIN tbl_siswa s ON p.nisn = s.nisn
                WHERE p.status_kehadiran = 'Terlambat'
                AND DATE(p.waktu_scan) = CURDATE()
                AND p.waktu_scan >= NOW() - INTERVAL 5 MINUTE
                AND NOT EXISTS (
                    SELECT 1 FROM tbl_notifikasi n 
                    WHERE n.id_presensi = p.id_presensi
                )
                LIMIT 10
            `);

            for (const siswa of terlambat) {
                if (process.env.SEND_NOTIF_TERLAMBAT === 'true') {
                    const pesan = `Anak Anda ${siswa.nama_lengkap} (${siswa.nisn}) *TERLAMBAT* masuk sekolah.\n\nWaktu masuk: ${new Date(siswa.waktu_scan).toLocaleTimeString('id-ID')}\n⏰ Harap segera hubungi sekolah jika ada masalah.`;
                    await sendWhatsAppNotification(siswa.no_hp_ortu, pesan, 'Terlambat');
                }
            }

        } catch (error) {
            console.error('[MONITOR ERROR]:', error.message);
        }
    }, 60000); // Cek setiap 1 menit

    console.log('[MONITORING] ✅ Presence monitoring dimulai');
}

// ==========================================
// MESSAGE HANDLING (Jika ada yang WA ke bot)
// ==========================================


client.on('message', async (message) => {
    // Cek apakah pesan dari grup - lebih robust check
    if (message.from.includes('@g.us') || message.isGroupMsg === true) {
        console.log(`[IGNORE] Pesan dari grup ${message.from}: "${message.body}"`);
        return;
    }

    // Hanya proses pesan dari chat pribadi
    try {
        const text = message.body.toLowerCase().trim();
        const sender = message.from;

        console.log(`[MSG] Dari chat pribadi ${sender}: ${message.body}`);

        // Command: /status
        if (text.startsWith('/status')) {
            const nisn = text.split('/status ')[1];
            if (!nisn || !nisn.trim()) {
                await message.reply('❌ Format salah.\nGunakan: `/status [NISN]`\nContoh: `/status 1234567890`');
                return;
            }

            try {
                if (!pool) {
                    await message.reply('❌ Database belum ready. Coba lagi nanti.');
                    return;
                }

                const cleanNISN = nisn.trim();
                const [siswa] = await pool.query(
                    'SELECT nama_lengkap, kelas FROM tbl_siswa WHERE nisn = ?',
                    [cleanNISN]
                );

                if (siswa.length === 0) {
                    await message.reply('❌ NISN tidak ditemukan di database');
                    return;
                }

                const [presensiHariIni] = await pool.query(
                    'SELECT waktu_scan, status_kehadiran FROM tbl_presensi WHERE nisn = ? AND DATE(waktu_scan) = CURDATE()',
                    [cleanNISN]
                );

                const [poin] = await pool.query(
                    'SELECT COALESCE(SUM(poin_sanksi), 0) as total FROM tbl_pelanggaran WHERE nisn = ?',
                    [cleanNISN]
                );

                let reply = `📋 *DATA SISWA*\n`;
                reply += `Nama: ${siswa[0].nama_lengkap}\n`;
                reply += `NISN: ${cleanNISN}\n`;
                reply += `Kelas: ${siswa[0].kelas}\n\n`;
                reply += `📌 *PRESENSI HARI INI*\n`;
                
                if (presensiHariIni.length > 0) {
                    reply += `Status: ${presensiHariIni[0].status_kehadiran}\n`;
                    reply += `Waktu: ${new Date(presensiHariIni[0].waktu_scan).toLocaleTimeString('id-ID')}\n`;
                } else {
                    reply += `Status: Belum Hadir\n`;
                }

                reply += `\n⚠️ *POIN PELANGGARAN*: ${poin[0].total}`;

                await message.reply(reply);
                
            } catch (error) {
                console.error('[STATUS CMD ERROR]:', error.message);
                await message.reply('❌ Terjadi error: ' + error.message);
            }
        }

        // Command: /bantuan atau /help
        else if (text === '/bantuan' || text === '/help') {
            const help = `🤖 *BOT SMART CARD SEKOLAH*\n\n`;
            const commands = `📋 *PERINTAH YANG TERSEDIA*:\n\n`;
            const cmd1 = `/status [NISN]\n  → Lihat data & presensi siswa\n  Contoh: /status 1234567890\n\n`;
            const cmd2 = `/bantuan\n  → Tampilkan bantuan ini\n\n`;
            const info = `ℹ️ *NOTIFIKASI OTOMATIS*:\n`;
            const notif = `  🔴 Siswa terlambat\n  ⚠️ Ada pelanggaran\n  📚 Buku harus dikembalikan`;

            await message.reply(help + commands + cmd1 + cmd2 + info + notif);
        }

        // Command: /halo atau /hi - greeting
        else if (text === '/halo' || text === '/hi' || text === '/hello') {
            await message.reply('Halo! 👋\nSaya adalah Bot Smart Card Sekolah.\n\nKetik: */bantuan* untuk melihat perintah yang tersedia.');
        }

        // Command: /test - untuk testing bot
        else if (text === '/test') {
            await message.reply('✅ Bot Smart Card aktif dan berjalan dengan baik!\n\nKetik */bantuan* untuk melihat semua perintah.');
        }

        // Default: Ignore pesan biasa (tidak reply)
        // Bot hanya reply untuk command yang valid
        else {
            console.log(`[IGNORE] Pesan biasa dari ${sender}: "${message.body}"`);
            // Tidak reply apapun untuk pesan biasa
        }

    } catch (error) {
        console.error('[MESSAGE ERROR]:', error.message);
        try {
            await message.reply('❌ Terjadi error pada bot. Silakan coba lagi.');
        } catch (replyError) {
            console.error('[REPLY ERROR]:', replyError.message);
        }
    }
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
process.on('SIGINT', async () => {
    console.log('\n[BOT] Shutting down...');
    await client.destroy();
    if (pool) await pool.end();
    process.exit(0);
});

console.log('[BOT] Starting WhatsApp Bot...\n');
