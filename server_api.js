/**
 * ============================================================================
 * NAMA FILE: server_api.js
 * DESKRIPSI: Backend Express.js untuk melayani request Dasbor Web Smart Card.
 * CARA JALAN: node server_api.js
 * ============================================================================
 */

require('dotenv').config(); // Load environment variables
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Mengizinkan request dari file HTML lokal
app.use(express.json()); // Memproses format JSON

// ==========================================
// KONFIGURASI DATABASE
// ==========================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_smart_card'
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validasi NISN format
 */
function validateNISN(nisn) {
    if (!nisn || typeof nisn !== 'string') return false;
    return /^\d{10,20}$/.test(nisn.trim());
}

/**
 * Format response error
 */
function errorResponse(message, statusCode = 400) {
    return { success: false, message, statusCode };
}

/**
 * Format response success
 */
function successResponse(data, message = 'Success') {
    return { success: true, message, data };
}

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
let pool;
async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('[DB] Berhasil terhubung ke MySQL:', dbConfig.database);
    } catch (error) {
        console.error('[DB ERROR] Gagal konek ke database:', error.message);
        process.exit(1);
    }
}
initDB();

// ==========================================
// ENDPOINT 1: PROSES SCAN KARTU DI GERBANG
// Endpoint ini menerima NISN, mencatat absen, dan mengembalikan profil singkat
// URL: POST http://localhost:3000/api/scan-gerbang
// ==========================================
app.post('/api/scan-gerbang', async (req, res) => {
    try {
        const { nisn } = req.body;

        // Validasi input
        if (!validateNISN(nisn)) {
            return res.status(400).json(errorResponse('NISN tidak valid'));
        }

        // 1. Cek apakah siswa terdaftar
        const [siswa] = await pool.query(
            'SELECT nisn, nama_lengkap, kelas, foto_profil FROM tbl_siswa WHERE nisn = ? AND status_aktif = "Aktif"',
            [nisn.trim()]
        );

        if (siswa.length === 0) {
            return res.status(404).json(errorResponse('Kartu Tidak Dikenali / Siswa Tidak Aktif'));
        }

        const dataSiswa = siswa[0];
        const waktuSekarang = new Date();
        const jamSekarang = waktuSekarang.getHours();
        const menitSekarang = waktuSekarang.getMinutes();

        // 2. Tentukan Status: Terlambat jika > 07:15
        let statusKehadiran = 'Hadir';
        let isTerlambat = false;
        
        if (jamSekarang > 7 || (jamSekarang === 7 && menitSekarang > 15)) {
            statusKehadiran = 'Terlambat';
            isTerlambat = true;
        }

        // 3. Cek apakah sudah absen HARI INI
        const tanggalHariIni = waktuSekarang.toISOString().slice(0, 10);
        const [cekAbsen] = await pool.query(
            'SELECT id_presensi FROM tbl_presensi WHERE nisn = ? AND DATE(waktu_scan) = ?',
            [nisn.trim(), tanggalHariIni]
        );

        let pesan = '';
        if (cekAbsen.length > 0) {
            pesan = 'Siswa sudah melakukan presensi hari ini.';
        } else {
            // 4. Simpan ke Database
            await pool.query(
                'INSERT INTO tbl_presensi (nisn, waktu_scan, status_kehadiran) VALUES (?, ?, ?)',
                [nisn.trim(), waktuSekarang, statusKehadiran]
            );
            pesan = 'Presensi berhasil dicatat.';
        }

        // 5. Kembalikan respons ke Frontend (Dasbor HTML)
        res.json(successResponse({
            nisn: dataSiswa.nisn,
            nama: dataSiswa.nama_lengkap,
            kelas: dataSiswa.kelas,
            foto: dataSiswa.foto_profil,
            terlambat: isTerlambat,
            waktu_scan: waktuSekarang.toLocaleTimeString('id-ID')
        }, pesan));

    } catch (error) {
        console.error('[API ERROR] /api/scan-gerbang:', error.message);
        res.status(500).json(errorResponse('Terjadi kesalahan pada server'));
    }
});

// ==========================================
// ENDPOINT 2: GET PROFIL LENGKAP (MODE ADMIN)
// URL: GET http://localhost:3000/api/profil/:nisn
// ==========================================
app.get('/api/profil/:nisn', async (req, res) => {
    try {
        const { nisn } = req.params;

        // Validasi input
        if (!validateNISN(nisn)) {
            return res.status(400).json(errorResponse('NISN tidak valid'));
        }

        // Ambil Data Utama
        const [siswa] = await pool.query(
            'SELECT nisn, nama_lengkap, kelas, no_hp_ortu, foto_profil FROM tbl_siswa WHERE nisn = ?',
            [nisn.trim()]
        );

        if (siswa.length === 0) {
            return res.status(404).json(errorResponse('Data tidak ditemukan', 404));
        }

        // Ambil Total Poin Pelanggaran
        const [poin] = await pool.query(
            'SELECT COALESCE(SUM(poin_sanksi), 0) as total_poin FROM tbl_pelanggaran WHERE nisn = ?',
            [nisn.trim()]
        );

        // Ambil Buku yang sedang dipinjam
        const [pinjaman] = await pool.query(
            `SELECT b.judul_buku, p.tgl_tenggat, p.id_peminjaman
             FROM tbl_peminjaman p 
             JOIN tbl_buku b ON p.kode_buku = b.kode_buku 
             WHERE p.nisn = ? AND p.status_pinjam = 'Dipinjam'`,
            [nisn.trim()]
        );

        // Ambil Presensi hari ini
        const hariIni = new Date().toISOString().slice(0, 10);
        const [presensiHariIni] = await pool.query(
            'SELECT waktu_scan, status_kehadiran FROM tbl_presensi WHERE nisn = ? AND DATE(waktu_scan) = ?',
            [nisn.trim(), hariIni]
        );

        // Kompilasi Data
        const profilLengkap = {
            ...siswa[0],
            total_poin: poin[0].total_poin || 0,
            pinjaman_aktif: pinjaman,
            presensi_hari_ini: presensiHariIni.length > 0 ? presensiHariIni[0] : null
        };

        res.json(successResponse(profilLengkap, 'Profil siswa ditemukan'));

    } catch (error) {
        console.error('[API ERROR] /api/profil:', error.message);
        res.status(500).json(errorResponse('Server error'));
    }
});

// ==========================================
// ENDPOINT 3: GET PRESENSI HARIAN
// URL: GET http://localhost:3000/api/presensi?tanggal=2025-03-05
// ==========================================
app.get('/api/presensi', async (req, res) => {
    try {
        const { tanggal, nisn } = req.query;
        let query = 'SELECT s.nisn, s.nama_lengkap, s.kelas, p.waktu_scan, p.status_kehadiran FROM tbl_presensi p JOIN tbl_siswa s ON p.nisn = s.nisn WHERE 1=1';
        let params = [];

        if (tanggal) {
            query += ' AND DATE(p.waktu_scan) = ?';
            params.push(tanggal);
        }

        if (nisn && validateNISN(nisn)) {
            query += ' AND p.nisn = ?';
            params.push(nisn.trim());
        }

        query += ' ORDER BY p.waktu_scan DESC LIMIT 500';

        const [hasil] = await pool.query(query, params);
        res.json(successResponse(hasil, `Total presensi: ${hasil.length}`));

    } catch (error) {
        console.error('[API ERROR] /api/presensi:', error.message);
        res.status(500).json(errorResponse('Server error'));
    }
});

// ==========================================
// ENDPOINT 4: GET STATISTIK PRESENSI
// URL: GET http://localhost:3000/api/stats/presensi?bulan=03&tahun=2025
// ==========================================
app.get('/api/stats/presensi', async (req, res) => {
    try {
        const { bulan = 3, tahun = 2025 } = req.query;

        const [stats] = await pool.query(`
            SELECT 
                s.nisn,
                s.nama_lengkap,
                s.kelas,
                COUNT(CASE WHEN p.status_kehadiran = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN p.status_kehadiran = 'Terlambat' THEN 1 END) as terlambat,
                COUNT(CASE WHEN p.status_kehadiran = 'Izin' THEN 1 END) as izin,
                COUNT(CASE WHEN p.status_kehadiran = 'Sakit' THEN 1 END) as sakit,
                COUNT(*) as total
            FROM tbl_siswa s
            LEFT JOIN tbl_presensi p ON s.nisn = p.nisn 
                AND MONTH(p.waktu_scan) = ? 
                AND YEAR(p.waktu_scan) = ?
            WHERE s.status_aktif = 'Aktif'
            GROUP BY s.nisn, s.nama_lengkap, s.kelas
            ORDER BY s.kelas, s.nama_lengkap
        `, [bulan, tahun]);

        res.json(successResponse(stats, `Statistik presensi bulan ${bulan}/${tahun}`));

    } catch (error) {
        console.error('[API ERROR] /api/stats/presensi:', error.message);
        res.status(500).json(errorResponse('Server error'));
    }
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error('[UNHANDLED ERROR]:', err.message);
    res.status(500).json(errorResponse('Internal server error'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`[SERVER] API Smart Card berjalan di http://localhost:${PORT}`);
});