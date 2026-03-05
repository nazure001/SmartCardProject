-- ============================================================
-- SMARTCARD PROJECT - DATABASE SCHEMA
-- Database: db_smart_card
-- ============================================================

-- ============================================================
-- TABLE: tbl_siswa (Master Data Siswa)
-- ============================================================
CREATE TABLE IF NOT EXISTS tbl_siswa (
    nisn VARCHAR(20) PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    kelas VARCHAR(10) NOT NULL,
    no_hp_ortu VARCHAR(15),
    email_ortu VARCHAR(50),
    foto_profil LONGBLOB,
    status_aktif ENUM('Aktif', 'Tidak Aktif') DEFAULT 'Aktif',
    tgl_daftar DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tbl_presensi (Absensi Siswa)
-- ============================================================
CREATE TABLE IF NOT EXISTS tbl_presensi (
    id_presensi INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL,
    waktu_scan DATETIME NOT NULL,
    status_kehadiran ENUM('Hadir', 'Terlambat', 'Izin', 'Sakit') DEFAULT 'Hadir',
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nisn) REFERENCES tbl_siswa(nisn) ON DELETE CASCADE,
    INDEX idx_nisn (nisn),
    INDEX idx_waktu (waktu_scan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tbl_pelanggaran (Catatan Pelanggaran)
-- ============================================================
CREATE TABLE IF NOT EXISTS tbl_pelanggaran (
    id_pelanggaran INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL,
    jenis_pelanggaran VARCHAR(50),
    deskripsi TEXT,
    poin_sanksi INT DEFAULT 0,
    tanggal_pelanggaran DATE,
    status ENUM('Dicatat', 'Diproses', 'Selesai') DEFAULT 'Dicatat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nisn) REFERENCES tbl_siswa(nisn) ON DELETE CASCADE,
    INDEX idx_nisn (nisn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tbl_buku (Katalog Buku Perpustakaan)
-- ============================================================
CREATE TABLE IF NOT EXISTS tbl_buku (
    kode_buku VARCHAR(20) PRIMARY KEY,
    judul_buku VARCHAR(150) NOT NULL,
    pengarang VARCHAR(100),
    penerbit VARCHAR(100),
    tahun_terbit INT,
    isbn VARCHAR(20),
    stok_tersedia INT DEFAULT 0,
    stok_total INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tbl_peminjaman (Catatan Peminjaman Buku)
-- ============================================================
CREATE TABLE IF NOT EXISTS tbl_peminjaman (
    id_peminjaman INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL,
    kode_buku VARCHAR(20) NOT NULL,
    tgl_pinjam DATE NOT NULL,
    tgl_tenggat DATE NOT NULL,
    tgl_kembali DATE,
    status_pinjam ENUM('Dipinjam', 'Dikembalikan', 'Hilang') DEFAULT 'Dipinjam',
    denda INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nisn) REFERENCES tbl_siswa(nisn) ON DELETE CASCADE,
    FOREIGN KEY (kode_buku) REFERENCES tbl_buku(kode_buku) ON DELETE CASCADE,
    INDEX idx_nisn (nisn),
    INDEX idx_status (status_pinjam)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tbl_notifikasi (Log Notifikasi WhatsApp)
-- ============================================================
CREATE TABLE IF NOT EXISTS tbl_notifikasi (
    id_notifikasi INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20),
    no_hp_tujuan VARCHAR(15) NOT NULL,
    tipe_notifikasi VARCHAR(50),
    isi_pesan TEXT,
    status_kirim ENUM('Terkirim', 'Gagal', 'Pending') DEFAULT 'Pending',
    waktu_kirim DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nisn) REFERENCES tbl_siswa(nisn) ON DELETE SET NULL,
    INDEX idx_status (status_kirim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE DATA (Opsional)
-- ============================================================

-- Insert sample siswa
INSERT INTO tbl_siswa (nisn, nama_lengkap, kelas, no_hp_ortu, email_ortu, status_aktif) VALUES
('1234567890', 'Budi Santoso', 'X A', '081234567890', 'budi@example.com', 'Aktif'),
('1234567891', 'Siti Nurhaliza', 'X B', '081234567891', 'siti@example.com', 'Aktif'),
('1234567892', 'Ahmad Wijaya', 'XI A', '081234567892', 'ahmad@example.com', 'Aktif');

-- Insert sample buku
INSERT INTO tbl_buku (kode_buku, judul_buku, pengarang, penerbit, tahun_terbit, stok_tersedia, stok_total) VALUES
('BK001', 'Laskar Pelangi', 'Andrea Hirata', 'Bentang', 2005, 3, 5),
('BK002', 'Filosofi Teras', 'Henry Manampiring', 'Bentang', 2018, 2, 3),
('BK003', 'Ayah', 'Sindhunata', 'Gramedia', 2001, 1, 2);
