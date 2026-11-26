<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state_builder.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Method harus POST.'], 405);
}

$pdo = getDB();
$user = requireHead($pdo);

try {
    resetDatabaseData($pdo);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'message' => 'Gagal mereset data database: ' . $e->getMessage()], 500);
}

jsonResponse([
    'ok'      => true,
    'message' => 'Data penilaian, konsensus, dan alternatif berhasil dikembalikan ke kondisi awal.',
    'state'   => buildAppState($pdo, $user),
]);
