<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Mengirim respons JSON standar dan menghentikan eksekusi.
 */
function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Membaca body JSON dari request.
 */
function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Mengambil data user yang sedang login dari session + database.
 */
function getCurrentUser(PDO $pdo): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT id, username, name, role, rank_level, icon, focus
         FROM users
         WHERE id = ?'
    );
    $stmt->execute([(int) $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        unset($_SESSION['user_id']);
        return null;
    }

    $user['id'] = (int) $user['id'];
    $user['rank'] = (int) $user['rank_level'];
    return $user;
}

/**
 * Wajib sudah login.
 */
function requireLogin(PDO $pdo): array
{
    $user = getCurrentUser($pdo);
    if (!$user) {
        jsonResponse(['ok' => false, 'message' => 'Sesi login tidak ditemukan. Silakan masuk terlebih dahulu.'], 401);
    }
    return $user;
}

/**
 * Wajib Kepala Lab (rank_level === 1).
 */
function requireHead(PDO $pdo): array
{
    $user = requireLogin($pdo);
    if ((int) $user['rank_level'] !== 1) {
        jsonResponse(['ok' => false, 'message' => 'Aksi ini hanya dapat dilakukan oleh Kepala Lab.'], 403);
    }
    return $user;
}

/**
 * Mengecek apakah konsensus sudah dijalankan (data terkunci).
 */
function isConsensusDone(PDO $pdo): bool
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM consensus_sessions')->fetchColumn();
    return $count > 0;
}
