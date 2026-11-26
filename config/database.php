<?php
declare(strict_types=1);

/**
 * Konfigurasi koneksi database MySQL (XAMPP / Railway) menggunakan PDO.
 * - Lokal XAMPP: buat config/database.local.php jika MySQL memakai password.
 * - Cloud Railway: otomatis membaca MYSQLHOST/MYSQLPORT/MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD
 *   atau MYSQL_URL, serta otomatis menginisialisasi 11 tabel dari database.sql jika DB masih kosong.
 */

$localConfig = __DIR__ . '/database.local.php';
if (is_file($localConfig)) {
    require_once $localConfig;
}

$mysqlUrl = getenv('MYSQL_URL') ?: getenv('DATABASE_URL') ?: '';
$parsedUrl = $mysqlUrl !== '' ? parse_url($mysqlUrl) : [];

$envHost = getenv('GDSS_DB_HOST') ?: getenv('MYSQLHOST') ?: ($parsedUrl['host'] ?? '') ?: '127.0.0.1';
$envPort = getenv('GDSS_DB_PORT') ?: getenv('MYSQLPORT') ?: (isset($parsedUrl['port']) ? (string) $parsedUrl['port'] : '') ?: '3306';
$envName = getenv('GDSS_DB_NAME') ?: getenv('MYSQLDATABASE') ?: (isset($parsedUrl['path']) ? ltrim((string) $parsedUrl['path'], '/') : '') ?: 'gdss_laptop_lab';
$envUser = getenv('GDSS_DB_USER') ?: getenv('MYSQLUSER') ?: ($parsedUrl['user'] ?? '') ?: 'root';

if (getenv('GDSS_DB_PASS') !== false) {
    $envPass = (string) getenv('GDSS_DB_PASS');
} elseif (getenv('MYSQLPASSWORD') !== false) {
    $envPass = (string) getenv('MYSQLPASSWORD');
} elseif (isset($parsedUrl['pass'])) {
    $envPass = (string) $parsedUrl['pass'];
} else {
    $envPass = '';
}

if (!defined('DB_HOST')) define('DB_HOST', $envHost);
if (!defined('DB_PORT')) define('DB_PORT', $envPort);
if (!defined('DB_NAME')) define('DB_NAME', $envName);
if (!defined('DB_USER')) define('DB_USER', $envUser);
if (!defined('DB_PASS')) define('DB_PASS', $envPass);

/**
 * Menginisialisasi skema 11 tabel + data awal dari database.sql
 * secara otomatis bila database masih kosong (mis. deploy pertama di Railway).
 */
function bootstrapSchemaIfEmpty(PDO $pdo): void
{
    $exists = $pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn();
    if ($exists !== false) {
        return;
    }

    $sqlFile = dirname(__DIR__) . '/database.sql';
    if (!is_file($sqlFile)) {
        return;
    }

    $sql = file_get_contents($sqlFile);
    if ($sql === false) {
        return;
    }

    // Hapus baris komentar & statement CREATE DATABASE / USE agar berjalan di DB aktif Railway
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    $sql = preg_replace('/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[^;]+;/i', '', $sql);
    $sql = preg_replace('/USE\s+`?[^`;]+`?\s*;/i', '', $sql);

    $statements = array_filter(
        array_map('trim', explode(";\n", str_replace("\r\n", "\n", $sql))),
        static fn(string $stmt): bool => $stmt !== ''
    );

    foreach ($statements as $stmt) {
        $pdo->exec($stmt);
    }
}

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
        bootstrapSchemaIfEmpty($pdo);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'      => false,
            'message' => 'Gagal terhubung ke database MySQL. Pastikan layanan MySQL aktif dan kredensial database sudah sesuai.',
            'detail'  => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $pdo;
}
