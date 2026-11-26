<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state_builder.php';
require_once __DIR__ . '/../includes/gdss_math.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Method harus POST.'], 405);
}

$pdo = getDB();
$user = requireHead($pdo);

if (isConsensusDone($pdo)) {
    jsonResponse(['ok' => false, 'message' => 'Konsensus Borda sudah dijalankan sebelumnya.'], 409);
}

$users = fetchUsers($pdo);
$alternatives = fetchAlternatives($pdo);

// Ambil hasil WP dari seluruh DM yang sudah status = 'submitted'
$stmt = $pdo->query(
    "SELECT u.username, w.alternative_id, w.rank_position, w.borda_points
     FROM submissions s
     INNER JOIN users u ON u.id = s.user_id
     INNER JOIN wp_results w ON w.submission_id = s.id
     WHERE s.status = 'submitted'"
);
$wpRows = $stmt->fetchAll();

$wpByUser = [];
foreach ($wpRows as $row) {
    $wpByUser[$row['username']][$row['alternative_id']] = [
        'rank'   => (int) $row['rank_position'],
        'points' => (float) $row['borda_points'],
    ];
}

try {
    $borda = computeBorda($alternatives, $users, $wpByUser, $user['username']);
} catch (InvalidArgumentException $e) {
    jsonResponse(['ok' => false, 'message' => $e->getMessage()], 422);
}

$pdo->beginTransaction();
try {
    $insSession = $pdo->prepare(
        'INSERT INTO consensus_sessions (run_by_user_id, winner_alternative_id, grand_total_points, tie_at_top, run_at)
         VALUES (?, ?, ?, ?, NOW())'
    );
    $insSession->execute([
        $user['id'],
        $borda['winnerId'],
        $borda['grandTotal'],
        $borda['tieAtTop'] ? 1 : 0,
    ]);
    $consensusId = (int) $pdo->lastInsertId();

    $insDetail = $pdo->prepare(
        'INSERT INTO consensus_details (consensus_id, alternative_id, total_points, borda_weight, final_rank)
         VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($borda['rows'] as $row) {
        $insDetail->execute([
            $consensusId,
            $row['altId'],
            $row['total'],
            $row['weight'],
            $row['finalRank'],
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    jsonResponse(['ok' => false, 'message' => 'Gagal menyimpan hasil konsensus Borda: ' . $e->getMessage()], 500);
}

jsonResponse([
    'ok'      => true,
    'message' => 'Konsensus Borda berhasil dijalankan dan disimpan ke database!',
    'state'   => buildAppState($pdo, $user),
]);
