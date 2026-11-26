<?php
declare(strict_types=1);

/**
 * Helper query database untuk menyusun state aplikasi GDSS & reset data.
 */

function fetchCriteria(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT id, name, type, icon, description AS `desc`, plain_text AS plain,
                scale_low AS lo, scale_high AS hi, scale_desc AS scale, sort_order
         FROM criteria
         ORDER BY sort_order ASC, id ASC'
    );
    return $stmt->fetchAll();
}

function fetchUsers(PDO $pdo): array
{
    $users = $pdo->query(
        'SELECT id, username, name, role, rank_level AS `rank`, icon, focus
         FROM users
         ORDER BY rank_level ASC, id ASC'
    )->fetchAll();

    $presetsRaw = $pdo->query(
        'SELECT user_id, criteria_id, preset_weight FROM user_preset_weights'
    )->fetchAll();

    $presetsByUser = [];
    foreach ($presetsRaw as $row) {
        $presetsByUser[(int) $row['user_id']][$row['criteria_id']] = (int) $row['preset_weight'];
    }

    foreach ($users as &$u) {
        $u['id'] = (int) $u['id'];
        $u['rank'] = (int) $u['rank'];
        $u['presetWeights'] = $presetsByUser[$u['id']] ?? [];
    }
    unset($u);

    return $users;
}

function fetchAlternatives(PDO $pdo): array
{
    $alts = $pdo->query(
        'SELECT id, name, price, cpu, ram, battery, warranty, note
         FROM alternatives
         ORDER BY id ASC'
    )->fetchAll();

    $ratingsRaw = $pdo->query(
        'SELECT alternative_id, criteria_id, rating FROM alternative_ratings'
    )->fetchAll();

    $ratingsByAlt = [];
    foreach ($ratingsRaw as $row) {
        $ratingsByAlt[$row['alternative_id']][$row['criteria_id']] = (int) $row['rating'];
    }

    foreach ($alts as &$a) {
        $a['price']    = (int) $a['price'];
        $a['ram']      = (int) $a['ram'];
        $a['battery']  = (float) $a['battery'];
        $a['warranty'] = (int) $a['warranty'];
        $a['note']     = $a['note'] ?? '';
        $a['ratings']  = $ratingsByAlt[$a['id']] ?? [];
    }
    unset($a);

    return $alts;
}

/**
 * Menyusun seluruh state aplikasi dari database MySQL.
 */
function buildAppState(PDO $pdo, ?array $currentUser = null): array
{
    $users = fetchUsers($pdo);
    $criteria = fetchCriteria($pdo);
    $alternatives = fetchAlternatives($pdo);

    $userById = [];
    foreach ($users as $u) {
        $userById[$u['id']] = $u;
    }

    $altNameById = [];
    foreach ($alternatives as $a) {
        $altNameById[$a['id']] = $a['name'];
    }

    // Ambil semua submissions (draft & submitted)
    $subsRaw = $pdo->query(
        'SELECT id, user_id, status, sum_weight, sum_vector_s, submitted_at, updated_at
         FROM submissions'
    )->fetchAll();

    $weightsRaw = $pdo->query(
        'SELECT submission_id, criteria_id, weight, normalized_weight, exponent
         FROM submission_weights'
    )->fetchAll();

    $scoresRaw = $pdo->query(
        'SELECT submission_id, alternative_id, criteria_id, score, term_value
         FROM submission_scores'
    )->fetchAll();

    $wpRaw = $pdo->query(
        'SELECT submission_id, alternative_id, vector_s, vector_v, rank_position, borda_points
         FROM wp_results
         ORDER BY rank_position ASC, alternative_id ASC'
    )->fetchAll();

    $weightsBySub = [];
    foreach ($weightsRaw as $w) {
        $weightsBySub[(int) $w['submission_id']][$w['criteria_id']] = $w;
    }

    $scoresBySub = [];
    foreach ($scoresRaw as $s) {
        $scoresBySub[(int) $s['submission_id']][$s['alternative_id']][$s['criteria_id']] = $s;
    }

    $wpBySub = [];
    foreach ($wpRaw as $r) {
        $wpBySub[(int) $r['submission_id']][] = $r;
    }

    $submissions = [];
    $drafts = [];

    foreach ($subsRaw as $sub) {
        $subId = (int) $sub['id'];
        $uid = (int) $sub['user_id'];
        if (!isset($userById[$uid])) {
            continue;
        }
        $uname = $userById[$uid]['username'];

        $wMap = [];
        $WMap = [];
        $expMap = [];
        foreach (($weightsBySub[$subId] ?? []) as $cid => $wRow) {
            $wMap[$cid] = (int) $wRow['weight'];
            if ($wRow['normalized_weight'] !== null) {
                $WMap[$cid] = (float) $wRow['normalized_weight'];
            }
            if ($wRow['exponent'] !== null) {
                $expMap[$cid] = (float) $wRow['exponent'];
            }
        }

        $scoreMap = [];
        $termsByAlt = [];
        foreach (($scoresBySub[$subId] ?? []) as $aid => $critRows) {
            foreach ($critRows as $cid => $sRow) {
                $scoreMap[$aid][$cid] = (int) $sRow['score'];
                if ($sRow['term_value'] !== null) {
                    $termsByAlt[$aid][$cid] = (float) $sRow['term_value'];
                }
            }
        }

        if ($sub['status'] === 'submitted') {
            $wpRows = [];
            foreach (($wpBySub[$subId] ?? []) as $r) {
                $aid = $r['alternative_id'];
                $wpRows[] = [
                    'altId'  => $aid,
                    'name'   => $altNameById[$aid] ?? $aid,
                    'x'      => $scoreMap[$aid] ?? [],
                    'terms'  => $termsByAlt[$aid] ?? [],
                    'S'      => (float) $r['vector_s'],
                    'V'      => (float) $r['vector_v'],
                    'rank'   => (int) $r['rank_position'],
                    'points' => (float) $r['borda_points'],
                ];
            }

            $submissions[$uname] = [
                'submitted'   => true,
                'submittedAt' => $sub['submitted_at'],
                'weights'     => $wMap,
                'scores'      => $scoreMap,
                'wp'          => [
                    'W'         => $WMap,
                    'exponents' => $expMap,
                    'sumW'      => (float) $sub['sum_weight'],
                    'sumS'      => (float) $sub['sum_vector_s'],
                    'rows'      => $wpRows,
                ],
            ];
        } else {
            // Hanya kirim draft milik user yang sedang login (atau semua jika ingin)
            if ($currentUser && $currentUser['username'] === $uname) {
                $drafts[$uname] = [
                    'weights' => $wMap,
                    'scores'  => $scoreMap,
                ];
            }
        }
    }

    // Ambil hasil konsensus terbaru (jika ada)
    $result = null;
    $consSession = $pdo->query(
        'SELECT id, run_by_user_id, winner_alternative_id, grand_total_points, tie_at_top, run_at
         FROM consensus_sessions
         ORDER BY id DESC
         LIMIT 1'
    )->fetch();

    if ($consSession) {
        $consId = (int) $consSession['id'];
        $detailsStmt = $pdo->prepare(
            'SELECT alternative_id, total_points, borda_weight, final_rank
             FROM consensus_details
             WHERE consensus_id = ?
             ORDER BY final_rank ASC'
        );
        $detailsStmt->execute([$consId]);
        $details = $detailsStmt->fetchAll();

        $dmOrder = array_map(static fn(array $u): string => $u['username'], $users);

        $rows = [];
        foreach ($details as $d) {
            $aid = $d['alternative_id'];
            $points = [];
            $ranks = [];
            foreach ($dmOrder as $uname) {
                $found = null;
                foreach (($submissions[$uname]['wp']['rows'] ?? []) as $wr) {
                    if ($wr['altId'] === $aid) {
                        $found = $wr;
                        break;
                    }
                }
                $points[$uname] = $found ? $found['points'] : 0;
                $ranks[$uname]  = $found ? $found['rank'] : 0;
            }

            $rows[] = [
                'altId'     => $aid,
                'name'      => $altNameById[$aid] ?? $aid,
                'points'    => $points,
                'ranks'     => $ranks,
                'total'     => (float) $d['total_points'],
                'weight'    => (float) $d['borda_weight'],
                'finalRank' => (int) $d['final_rank'],
            ];
        }

        $runByUser = $userById[(int) $consSession['run_by_user_id']] ?? null;
        $result = [
            'id'         => $consId,
            'runAt'      => $consSession['run_at'],
            'runBy'      => $runByUser ? $runByUser['username'] : 'kepala',
            'dmOrder'    => $dmOrder,
            'rows'       => $rows,
            'grandTotal' => (float) $consSession['grand_total_points'],
            'winnerId'   => $consSession['winner_alternative_id'],
            'tieAtTop'   => (bool) $consSession['tie_at_top'],
        ];
    }

    return [
        'users'        => $users,
        'criteria'     => $criteria,
        'alternatives' => $alternatives,
        'submissions'  => (object) $submissions,
        'drafts'       => (object) $drafts,
        'result'       => $result,
    ];
}

/**
 * Mengembalikan seluruh data penilaian, konsensus, dan alternatif ke kondisi default.
 */
function resetDatabaseData(PDO $pdo): void
{
    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM consensus_details');
        $pdo->exec('DELETE FROM consensus_sessions');
        $pdo->exec('DELETE FROM wp_results');
        $pdo->exec('DELETE FROM submission_scores');
        $pdo->exec('DELETE FROM submission_weights');
        $pdo->exec('DELETE FROM submissions');
        $pdo->exec('DELETE FROM alternative_ratings');
        $pdo->exec('DELETE FROM alternatives');

        $defaultAlts = [
            ['A1', 'Asus ExpertBook B1',  10500000, 'Intel Core i5-1235U', 8,  10.0, 2, 'Seimbang untuk kebutuhan lab umum, bodi ringan dan kokoh.', [2, 3, 3, 4, 3]],
            ['A2', 'Lenovo ThinkPad E14', 14500000, 'AMD Ryzen 5 7530U',   16, 11.0, 3, 'Keyboard nyaman, suku cadang mudah didapat, garansi panjang.', [4, 4, 4, 4, 5]],
            ['A3', 'HP ProBook 440',      12000000, 'Intel Core i5-1335U', 8,   9.0, 1, 'Harga menengah, performa cukup untuk praktikum standar.', [3, 4, 3, 3, 2]],
            ['A4', 'Acer TravelMate P2',   8900000, 'Intel Core i3-1215U', 8,   8.0, 1, 'Paling terjangkau, cocok untuk anggaran terbatas.', [1, 2, 3, 2, 2]],
            ['A5', 'Dell Latitude 3440',  15500000, 'Intel Core i7-1355U', 16, 10.0, 3, 'Performa tertinggi, layanan purna jual korporat.', [5, 5, 4, 3, 5]],
        ];

        $insAlt = $pdo->prepare(
            'INSERT INTO alternatives (id, name, price, cpu, ram, battery, warranty, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $insRat = $pdo->prepare(
            'INSERT INTO alternative_ratings (alternative_id, criteria_id, rating)
             VALUES (?, ?, ?)'
        );

        $critIds = ['C1', 'C2', 'C3', 'C4', 'C5'];
        foreach ($defaultAlts as $a) {
            $insAlt->execute([$a[0], $a[1], $a[2], $a[3], $a[4], $a[5], $a[6], $a[7]]);
            foreach ($critIds as $idx => $cid) {
                $insRat->execute([$a[0], $cid, $a[8][$idx]]);
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
