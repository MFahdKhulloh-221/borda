<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state_builder.php';
require_once __DIR__ . '/../includes/gdss_math.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Method harus POST.'], 405);
}

$pdo = getDB();
$user = requireLogin($pdo);

if (isConsensusDone($pdo)) {
    jsonResponse(['ok' => false, 'message' => 'Konsensus sudah dijalankan; penilaian terkunci.'], 409);
}

$input = getJsonInput();
$action = (string) ($input['action'] ?? 'submit');
$weights = is_array($input['weights'] ?? null) ? $input['weights'] : [];
$scores  = is_array($input['scores'] ?? null) ? $input['scores'] : [];

$criteria = fetchCriteria($pdo);
$alternatives = fetchAlternatives($pdo);

/**
 * Helper memastikan baris submissions untuk user tersedia dan mengembalikan submission_id.
 */
function ensureSubmissionRow(PDO $pdo, int $userId, string $defaultStatus = 'draft'): array
{
    $stmt = $pdo->prepare('SELECT id, status FROM submissions WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if ($row) {
        return ['id' => (int) $row['id'], 'status' => $row['status']];
    }

    $ins = $pdo->prepare('INSERT INTO submissions (user_id, status) VALUES (?, ?)');
    $ins->execute([$userId, $defaultStatus]);
    return ['id' => (int) $pdo->lastInsertId(), 'status' => $defaultStatus];
}

if ($action === 'save-draft') {
    // Jangan menimpa submission yang sudah status='submitted' secara diam-diam dengan draft parsial;
    // hanya simpan ke DB jika belum submitted (user yang edit hasil akan submit ulang saat menekan Kirim).
    $stmt = $pdo->prepare('SELECT id, status FROM submissions WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch();

    if ($existing && $existing['status'] === 'submitted') {
        jsonResponse(['ok' => true, 'saved' => false, 'note' => 'Mode ubah penilaian; akan disimpan ke database saat dikirim.']);
    }

    $pdo->beginTransaction();
    try {
        $sub = ensureSubmissionRow($pdo, $user['id'], 'draft');
        $subId = $sub['id'];

        $upW = $pdo->prepare(
            'INSERT INTO submission_weights (submission_id, criteria_id, weight)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE weight = VALUES(weight)'
        );
        foreach ($criteria as $c) {
            $cid = $c['id'];
            if (isset($weights[$cid]) && is_numeric($weights[$cid])) {
                $w = (int) $weights[$cid];
                if ($w >= 1 && $w <= 5) {
                    $upW->execute([$subId, $cid, $w]);
                }
            }
        }

        $upS = $pdo->prepare(
            'INSERT INTO submission_scores (submission_id, alternative_id, criteria_id, score)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE score = VALUES(score)'
        );
        foreach ($alternatives as $a) {
            $aid = $a['id'];
            foreach ($criteria as $c) {
                $cid = $c['id'];
                if (isset($scores[$aid][$cid]) && is_numeric($scores[$aid][$cid])) {
                    $sc = (int) $scores[$aid][$cid];
                    if ($sc >= 1 && $sc <= 5) {
                        $upS->execute([$subId, $aid, $cid, $sc]);
                    }
                }
            }
        }

        $pdo->prepare('UPDATE submissions SET updated_at = NOW() WHERE id = ?')->execute([$subId]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'message' => 'Gagal menyimpan draft: ' . $e->getMessage()], 500);
    }

    jsonResponse(['ok' => true, 'saved' => true]);
}

if ($action === 'submit') {
    try {
        $wp = computeWP($weights, $scores, $criteria, $alternatives);
    } catch (InvalidArgumentException $e) {
        jsonResponse(['ok' => false, 'message' => $e->getMessage()], 422);
    }

    $pdo->beginTransaction();
    try {
        $sub = ensureSubmissionRow($pdo, $user['id'], 'draft');
        $subId = $sub['id'];

        // Bersihkan detail lama agar konsisten dengan daftar alternatif terkini
        $pdo->prepare('DELETE FROM submission_weights WHERE submission_id = ?')->execute([$subId]);
        $pdo->prepare('DELETE FROM submission_scores WHERE submission_id = ?')->execute([$subId]);
        $pdo->prepare('DELETE FROM wp_results WHERE submission_id = ?')->execute([$subId]);

        // Simpan bobot + normalisasi + pangkat
        $insW = $pdo->prepare(
            'INSERT INTO submission_weights (submission_id, criteria_id, weight, normalized_weight, exponent)
             VALUES (?, ?, ?, ?, ?)'
        );
        foreach ($criteria as $c) {
            $cid = $c['id'];
            $insW->execute([
                $subId,
                $cid,
                (int) $weights[$cid],
                $wp['W'][$cid],
                $wp['exponents'][$cid],
            ]);
        }

        // Simpan matriks keputusan Xij + nilai pangkat Xij^(+-Wj) dan hasil WP
        $insS = $pdo->prepare(
            'INSERT INTO submission_scores (submission_id, alternative_id, criteria_id, score, term_value)
             VALUES (?, ?, ?, ?, ?)'
        );
        $insWP = $pdo->prepare(
            'INSERT INTO wp_results (submission_id, alternative_id, vector_s, vector_v, rank_position, borda_points)
             VALUES (?, ?, ?, ?, ?, ?)'
        );

        foreach ($wp['rows'] as $row) {
            $aid = $row['altId'];
            foreach ($criteria as $c) {
                $cid = $c['id'];
                $insS->execute([
                    $subId,
                    $aid,
                    $cid,
                    (int) $row['x'][$cid],
                    $row['terms'][$cid],
                ]);
            }

            $insWP->execute([
                $subId,
                $aid,
                $row['S'],
                $row['V'],
                $row['rank'],
                $row['points'],
            ]);
        }

        // Update header submission menjadi submitted
        $updSub = $pdo->prepare(
            "UPDATE submissions
             SET status = 'submitted', sum_weight = ?, sum_vector_s = ?, submitted_at = NOW()
             WHERE id = ?"
        );
        $updSub->execute([$wp['sumW'], $wp['sumS'], $subId]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'message' => 'Gagal menyimpan penilaian ke database: ' . $e->getMessage()], 500);
    }

    jsonResponse([
        'ok'      => true,
        'message' => 'Penilaian berhasil dihitung dan disimpan ke database MySQL!',
        'state'   => buildAppState($pdo, $user),
    ]);
}

jsonResponse(['ok' => false, 'message' => 'Aksi penilaian tidak dikenal.'], 400);
