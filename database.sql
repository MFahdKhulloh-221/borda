-- ============================================================================
-- DATABASE: GDSS Pemilihan Laptop Laboratorium Komputer
-- Metode  : Weighted Product (Individu) + Borda (Konsensus Kelompok)
-- Engine  : MySQL / MariaDB (XAMPP / phpMyAdmin) - InnoDB, UTF8MB4
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `gdss_laptop_lab`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gdss_laptop_lab`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `consensus_details`;
DROP TABLE IF EXISTS `consensus_sessions`;
DROP TABLE IF EXISTS `wp_results`;
DROP TABLE IF EXISTS `submission_scores`;
DROP TABLE IF EXISTS `submission_weights`;
DROP TABLE IF EXISTS `submissions`;
DROP TABLE IF EXISTS `user_preset_weights`;
DROP TABLE IF EXISTS `alternative_ratings`;
DROP TABLE IF EXISTS `alternatives`;
DROP TABLE IF EXISTS `criteria`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Tabel users (Decision Makers / Pengambil Keputusan)
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(60) NOT NULL,
  `rank_level` TINYINT UNSIGNED NOT NULL COMMENT '1 = Jabatan tertinggi (Kepala Lab)',
  `icon` VARCHAR(40) NOT NULL DEFAULT 'user',
  `focus` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Tabel criteria (Kriteria Pengambilan Keputusan)
-- ----------------------------------------------------------------------------
CREATE TABLE `criteria` (
  `id` VARCHAR(10) NOT NULL COMMENT 'Kode kriteria, mis. C1..C5',
  `name` VARCHAR(80) NOT NULL,
  `type` ENUM('cost', 'benefit') NOT NULL,
  `icon` VARCHAR(40) NOT NULL DEFAULT 'circle',
  `description` VARCHAR(160) NOT NULL,
  `plain_text` VARCHAR(160) NOT NULL,
  `scale_low` VARCHAR(50) NOT NULL,
  `scale_high` VARCHAR(50) NOT NULL,
  `scale_desc` VARCHAR(160) NOT NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Tabel alternatives (Alternatif Laptop yang Dibandingkan)
-- ----------------------------------------------------------------------------
CREATE TABLE `alternatives` (
  `id` VARCHAR(10) NOT NULL COMMENT 'Kode alternatif, mis. A1..A5',
  `name` VARCHAR(100) NOT NULL,
  `price` BIGINT UNSIGNED NOT NULL COMMENT 'Harga dalam Rupiah',
  `cpu` VARCHAR(100) NOT NULL,
  `ram` SMALLINT UNSIGNED NOT NULL COMMENT 'Kapasitas RAM dalam GB',
  `battery` DECIMAL(4,1) NOT NULL COMMENT 'Daya tahan baterai dalam jam',
  `warranty` TINYINT UNSIGNED NOT NULL COMMENT 'Lama garansi dalam tahun',
  `note` TEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_alternatives_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Tabel alternative_ratings (Nilai Referensi Skala 1-5 per Alternatif & Kriteria)
--    Relasi M:N antara alternatives dan criteria
-- ----------------------------------------------------------------------------
CREATE TABLE `alternative_ratings` (
  `alternative_id` VARCHAR(10) NOT NULL,
  `criteria_id` VARCHAR(10) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL COMMENT 'Skala 1-5',
  PRIMARY KEY (`alternative_id`, `criteria_id`),
  KEY `idx_ar_criteria` (`criteria_id`),
  CONSTRAINT `fk_ar_alternative`
    FOREIGN KEY (`alternative_id`) REFERENCES `alternatives` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ar_criteria`
    FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Tabel user_preset_weights (Saran Bobot Awal per Decision Maker & Kriteria)
--    Relasi M:N antara users dan criteria
-- ----------------------------------------------------------------------------
CREATE TABLE `user_preset_weights` (
  `user_id` INT UNSIGNED NOT NULL,
  `criteria_id` VARCHAR(10) NOT NULL,
  `preset_weight` TINYINT UNSIGNED NOT NULL COMMENT 'Skala 1-5',
  PRIMARY KEY (`user_id`, `criteria_id`),
  KEY `idx_upw_criteria` (`criteria_id`),
  CONSTRAINT `fk_upw_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_upw_criteria`
    FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Tabel submissions (Header Penilaian & Draft per Decision Maker)
--    Relasi 1:1 dengan users (1 sesi penilaian aktif per user)
-- ----------------------------------------------------------------------------
CREATE TABLE `submissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `status` ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
  `sum_weight` DECIMAL(10,4) NULL,
  `sum_vector_s` DECIMAL(14,8) NULL,
  `submitted_at` DATETIME NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_submissions_user` (`user_id`),
  CONSTRAINT `fk_submissions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Tabel submission_weights (Bobot Kriteria & Hasil Normalisasi WP per DM)
-- ----------------------------------------------------------------------------
CREATE TABLE `submission_weights` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `submission_id` INT UNSIGNED NOT NULL,
  `criteria_id` VARCHAR(10) NOT NULL,
  `weight` TINYINT UNSIGNED NOT NULL COMMENT 'Bobot mentah 1-5',
  `normalized_weight` DECIMAL(10,6) NULL COMMENT 'Wj = wj / sum(w)',
  `exponent` DECIMAL(10,6) NULL COMMENT '+Wj (benefit) atau -Wj (cost)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sw_sub_crit` (`submission_id`, `criteria_id`),
  KEY `idx_sw_criteria` (`criteria_id`),
  CONSTRAINT `fk_sw_submission`
    FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sw_criteria`
    FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Tabel submission_scores (Matriks Keputusan Xij & Nilai Pangkat Xij^(+-Wj))
-- ----------------------------------------------------------------------------
CREATE TABLE `submission_scores` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `submission_id` INT UNSIGNED NOT NULL,
  `alternative_id` VARCHAR(10) NOT NULL,
  `criteria_id` VARCHAR(10) NOT NULL,
  `score` TINYINT UNSIGNED NOT NULL COMMENT 'Nilai Xij skala 1-5',
  `term_value` DECIMAL(14,8) NULL COMMENT 'Nilai Xij^(+-Wj)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ss_sub_alt_crit` (`submission_id`, `alternative_id`, `criteria_id`),
  KEY `idx_ss_alternative` (`alternative_id`),
  KEY `idx_ss_criteria` (`criteria_id`),
  CONSTRAINT `fk_ss_submission`
    FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ss_alternative`
    FOREIGN KEY (`alternative_id`) REFERENCES `alternatives` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ss_criteria`
    FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Tabel wp_results (Hasil Perhitungan Vektor S, Vektor V, Rank & Poin Borda Individu)
-- ----------------------------------------------------------------------------
CREATE TABLE `wp_results` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `submission_id` INT UNSIGNED NOT NULL,
  `alternative_id` VARCHAR(10) NOT NULL,
  `vector_s` DECIMAL(14,8) NOT NULL,
  `vector_v` DECIMAL(14,8) NOT NULL,
  `rank_position` SMALLINT UNSIGNED NOT NULL,
  `borda_points` DECIMAL(8,4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wp_sub_alt` (`submission_id`, `alternative_id`),
  KEY `idx_wp_alternative` (`alternative_id`),
  CONSTRAINT `fk_wp_submission`
    FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wp_alternative`
    FOREIGN KEY (`alternative_id`) REFERENCES `alternatives` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Tabel consensus_sessions (Header Hasil Konsensus Borda Kelompok)
-- ----------------------------------------------------------------------------
CREATE TABLE `consensus_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `run_by_user_id` INT UNSIGNED NOT NULL,
  `winner_alternative_id` VARCHAR(10) NOT NULL,
  `grand_total_points` DECIMAL(10,4) NOT NULL,
  `tie_at_top` TINYINT(1) NOT NULL DEFAULT 0,
  `run_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cs_user` (`run_by_user_id`),
  KEY `idx_cs_winner` (`winner_alternative_id`),
  CONSTRAINT `fk_cs_user`
    FOREIGN KEY (`run_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cs_winner`
    FOREIGN KEY (`winner_alternative_id`) REFERENCES `alternatives` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Tabel consensus_details (Detail Peringkat & Total Poin Borda per Alternatif)
-- ----------------------------------------------------------------------------
CREATE TABLE `consensus_details` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `consensus_id` INT UNSIGNED NOT NULL,
  `alternative_id` VARCHAR(10) NOT NULL,
  `total_points` DECIMAL(10,4) NOT NULL,
  `borda_weight` DECIMAL(10,6) NOT NULL,
  `final_rank` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cd_cons_alt` (`consensus_id`, `alternative_id`),
  KEY `idx_cd_alternative` (`alternative_id`),
  CONSTRAINT `fk_cd_consensus`
    FOREIGN KEY (`consensus_id`) REFERENCES `consensus_sessions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cd_alternative`
    FOREIGN KEY (`alternative_id`) REFERENCES `alternatives` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATA AWAL (SEEDER)
-- Password akun demo:
--   kepala  -> kepala123
--   dosen   -> dosen123
--   asisten -> asisten123
-- ============================================================================

INSERT INTO `users` (`id`, `username`, `password_hash`, `name`, `role`, `rank_level`, `icon`, `focus`) VALUES
  (1, 'kepala',  '$2y$10$QZErXJRKApWfL/b2ZGezmeTZFmVfYiMLBxx9K8Udfx7lZyNm2Y0hq', 'Kepala Lab',     'Kepala Lab',     1, 'briefcase',      'Fokus pada anggaran (harga).'),
  (2, 'dosen',   '$2y$10$lz.FRHQgNgNsVeRMUg3UG.DWEQOFbYPinHDiWq1z18sN04KpJiWtu', 'Dosen Pengampu', 'Dosen Pengampu', 2, 'graduation-cap', 'Fokus pada kebutuhan materi praktikum (prosesor & RAM).'),
  (3, 'asisten', '$2y$10$poXAAmIjuwZSkbjDHEvjEe7o6Xjlu7Xo8Yot9VkmdvcQIz.pBwjDy', 'Asisten Lab',    'Asisten Lab',    3, 'wrench',         'Fokus pada kemudahan perawatan (baterai & garansi).');

INSERT INTO `criteria` (`id`, `name`, `type`, `icon`, `description`, `plain_text`, `scale_low`, `scale_high`, `scale_desc`, `sort_order`) VALUES
  ('C1', 'Harga',    'cost',    'wallet',       'Harga per unit laptop',  'Makin murah makin bagus',   'Murah banget', 'Mahal banget',   '1 = sangat murah … 5 = sangat mahal',     1),
  ('C2', 'Prosesor', 'benefit', 'cpu',          'Performa prosesor',      'Makin kencang makin bagus', 'Lemah',        'Sangat kencang', '1 = sangat lemah … 5 = sangat kencang',   2),
  ('C3', 'RAM',      'benefit', 'memory-stick', 'Kapasitas memori',       'Makin besar makin bagus',   'Kecil',        'Besar',          '1 = sangat kecil … 5 = sangat besar',     3),
  ('C4', 'Baterai',  'benefit', 'battery-full', 'Daya tahan baterai',     'Makin awet makin bagus',    'Boros',        'Awet',           '1 = sangat boros … 5 = sangat awet',      4),
  ('C5', 'Garansi',  'benefit', 'shield-check', 'Lama & cakupan garansi', 'Makin panjang makin bagus', 'Singkat',      'Panjang',        '1 = sangat singkat … 5 = sangat panjang', 5);

INSERT INTO `user_preset_weights` (`user_id`, `criteria_id`, `preset_weight`) VALUES
  -- Kepala Lab: fokus anggaran
  (1, 'C1', 5), (1, 'C2', 3), (1, 'C3', 3), (1, 'C4', 2), (1, 'C5', 3),
  -- Dosen Pengampu: fokus prosesor & RAM
  (2, 'C1', 2), (2, 'C2', 5), (2, 'C3', 5), (2, 'C4', 3), (2, 'C5', 3),
  -- Asisten Lab: fokus baterai & garansi
  (3, 'C1', 3), (3, 'C2', 2), (3, 'C3', 3), (3, 'C4', 4), (3, 'C5', 5);

INSERT INTO `alternatives` (`id`, `name`, `price`, `cpu`, `ram`, `battery`, `warranty`, `note`) VALUES
  ('A1', 'Asus ExpertBook B1',  10500000, 'Intel Core i5-1235U', 8,  10.0, 2, 'Seimbang untuk kebutuhan lab umum, bodi ringan dan kokoh.'),
  ('A2', 'Lenovo ThinkPad E14', 14500000, 'AMD Ryzen 5 7530U',   16, 11.0, 3, 'Keyboard nyaman, suku cadang mudah didapat, garansi panjang.'),
  ('A3', 'HP ProBook 440',      12000000, 'Intel Core i5-1335U', 8,   9.0, 1, 'Harga menengah, performa cukup untuk praktikum standar.'),
  ('A4', 'Acer TravelMate P2',   8900000, 'Intel Core i3-1215U', 8,   8.0, 1, 'Paling terjangkau, cocok untuk anggaran terbatas.'),
  ('A5', 'Dell Latitude 3440',  15500000, 'Intel Core i7-1355U', 16, 10.0, 3, 'Performa tertinggi, layanan purna jual korporat.');

INSERT INTO `alternative_ratings` (`alternative_id`, `criteria_id`, `rating`) VALUES
  ('A1', 'C1', 2), ('A1', 'C2', 3), ('A1', 'C3', 3), ('A1', 'C4', 4), ('A1', 'C5', 3),
  ('A2', 'C1', 4), ('A2', 'C2', 4), ('A2', 'C3', 4), ('A2', 'C4', 4), ('A2', 'C5', 5),
  ('A3', 'C1', 3), ('A3', 'C2', 4), ('A3', 'C3', 3), ('A3', 'C4', 3), ('A3', 'C5', 2),
  ('A4', 'C1', 1), ('A4', 'C2', 2), ('A4', 'C3', 3), ('A4', 'C4', 2), ('A4', 'C5', 2),
  ('A5', 'C1', 5), ('A5', 'C2', 5), ('A5', 'C3', 4), ('A5', 'C4', 3), ('A5', 'C5', 5);
