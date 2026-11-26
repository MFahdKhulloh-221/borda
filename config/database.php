<?php
declare(strict_types=1);

/**
 * Konfigurasi koneksi database MySQL (XAMPP / phpMyAdmin) menggunakan PDO.
 * Untuk kredensial lokal yang berbeda (mis. MySQL dengan password),
 * buat file config/database.local.php (otomatis diabaikan oleh Git).
 */

$localConfig = __DIR__ . '/database.local.php';
if (is_file($localConfig)) {
    require_once $localConfig;
}

if (!defined('DB_HOST')) define('DB_HOST', getenv('GDSS_DB_HOST') ?: '127.0.0.1');
if (!defined('DB_PORT')) define('DB_PORT', getenv('GDSS_DB_PORT') ?: '3306');
if (!defined('DB_NAME')) define('DB_NAME', getenv('GDSS_DB_NAME') ?: 'gdss_laptop_lab');
if (!defined('DB_USER')) define('DB_USER', getenv('GDSS_DB_USER') ?: 'root');
if (!defined('DB_PASS')) define('DB_PASS', getenv('GDSS_DB_PASS') !== false ? getenv('GDSS_DB_PASS') : '');

/**
 * Mengembalikan instance PDO singleton.
 */
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'      => false,
            'message' => 'Gagal terhubung ke database MySQL. Pastikan layanan MySQL XAMPP aktif dan file database.sql sudah di-import ke phpMyAdmin.',
            'detail'  => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $pdo;
}
