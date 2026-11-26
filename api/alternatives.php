<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state_builder.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Method harus POST.'], 405);
}

$pdo = getDB();
$user = requireHead($pdo);

if (isConsensusDone($pdo)) {
    jsonResponse(['ok' => false, 'message' => 'Konsensus sudah dijalankan; data laptop terkunci.'], 409);
}

$input = getJsonInput();
$action = (string) ($input['action'] ?? 'update');
$criteria = fetchCriteria($pdo);

/**
 * Validasi input alternatif (untuk create & update).
 */
function validateAlternativeInput(PDO $pdo, array $input, array $criteria, ?string $excludeId = null): array
{
    $name     = trim((string) ($input['name'] ?? ''));
    $cpu      = trim((string) ($input['cpu'] ?? ''));
    $price    = filter_var($input['price'] ?? null, FILTER_VALIDATE_INT);
    $ram      = filter_var($input['ram'] ?? null, FILTER_VALIDATE_INT);
    $battery  = filter_var($input['battery'] ?? null, FILTER_VALIDATE_FLOAT);
    $warranty = filter_var($input['warranty'] ?? null, FILTER_VALIDATE_INT);
    $note     = trim((string) ($input['note'] ?? ''));
    $ratingsIn = is_array($input['ratings'] ?? null) ? $input['ratings'] : [];

    if ($name === '' || mb_strlen($name) > 100) {
        jsonResponse(['ok' => false, 'message' => 'Nama laptop wajib diisi (maks 100 karakter).'], 422);
    }
    if ($cpu === '' || mb_strlen($cpu) > 100) {
        jsonResponse(['ok' => false, 'message' => 'Prosesor wajib diisi (maks 100 karakter).'], 422);
    }
    if ($price === false || $price <= 0) {
        jsonResponse(['ok' => false, 'message' => 'Harga harus bilangan bulat lebih dari 0.'], 422);
    }
    if ($ram === false || $ram <= 0) {
        jsonResponse(['ok' => false, 'message' => 'RAM harus bilangan bulat lebih dari 0.'], 422);
    }
    if ($battery === false || $battery <= 0 || $battery > 99) {
        jsonResponse(['ok' => false, 'message' => 'Baterai harus angka lebih dari 0 jam.'], 422);
    }
    if ($warranty === false || $warranty <= 0 || $warranty > 20) {
        jsonResponse(['ok' => false, 'message' => 'Garansi harus bilangan bulat 1-20 tahun.'], 422);
    }

    // Cek duplikat nama
    if ($excludeId !== null) {
        $dup = $pdo->prepare('SELECT id FROM alternatives WHERE LOWER(name) = LOWER(?) AND id <> ?');
        $dup->execute([$name, $excludeId]);
    } else {
        $dup = $pdo->prepare('SELECT id FROM alternatives WHERE LOWER(name) = LOWER(?)');
        $dup->execute([$name]);
    }
    if ($dup->fetch()) {
        jsonResponse(['ok' => false, 'message' => 'Nama laptop sudah digunakan.'], 422);
    }

    $ratings = [];
    foreach ($criteria as $c) {
        $cid = $c['id'];
        $r = filter_var($ratingsIn[$cid] ?? null, FILTER_VALIDATE_INT);
        if ($r === false || $r < 1 || $r > 5) {
            jsonResponse(['ok' => false, 'message' => "Nilai saran awal {$c['name']} harus bilangan bulat 1-5."], 422);
        }
        $ratings[$cid] = $r;
    }

    return [
        'name'     => $name,
        'price'    => (int) $price,
        'cpu'      => $cpu,
        'ram'      => (int) $ram,
        'battery'  => round((float) $battery, 1),
        'warranty' => (int) $warranty,
        'note'     => mb_substr($note, 0, 250),
        'ratings'  => $ratings,
    ];
}

if ($action === 'update') {
    $id = trim((string) ($input['id'] ?? ''));
    if ($id === '') {
        jsonResponse(['ok' => false, 'message' => 'ID alternatif tidak valid.'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM alternatives WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) {
        jsonResponse(['ok' => false, 'message' => 'Alternatif tidak ditemukan.'], 404);
    }

    $data = validateAlternativeInput($pdo, $input, $criteria, $id);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'UPDATE alternatives
             SET name = ?, price = ?, cpu = ?, ram = ?, battery = ?, warranty = ?, note = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $data['name'], $data['price'], $data['cpu'], $data['ram'],
            $data['battery'], $data['warranty'], $data['note'], $id,
        ]);

        $upRat = $pdo->prepare(
            'INSERT INTO alternative_ratings (alternative_id, criteria_id, rating)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating)'
        );
        foreach ($data['ratings'] as $cid => $val) {
            $upRat->execute([$id, $cid, $val]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'message' => 'Gagal menyimpan perubahan alternatif: ' . $e->getMessage()], 500);
    }

    jsonResponse([
        'ok'      => true,
        'message' => 'Data alternatif berhasil diperbarui di database.',
        'state'   => buildAppState($pdo, $user),
    ]);
}

if ($action === 'create') {
    $data = validateAlternativeInput($pdo, $input, $criteria, null);

    // Generate ID baru berurutan: A6, A7, ...
    $existingIds = $pdo->query('SELECT id FROM alternatives')->fetchAll(PDO::FETCH_COLUMN);
    $maxNum = 0;
    foreach ($existingIds as $eid) {
        if (preg_match('/^A(\d+)$/', (string) $eid, $m)) {
            $maxNum = max($maxNum, (int) $m[1]);
        }
    }
    $newId = 'A' . ($maxNum + 1);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO alternatives (id, name, price, cpu, ram, battery, warranty, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $newId, $data['name'], $data['price'], $data['cpu'],
            $data['ram'], $data['battery'], $data['warranty'], $data['note'],
        ]);

        $insRat = $pdo->prepare(
            'INSERT INTO alternative_ratings (alternative_id, criteria_id, rating)
             VALUES (?, ?, ?)'
        );
        foreach ($data['ratings'] as $cid => $val) {
            $insRat->execute([$newId, $cid, $val]);
        }

        // Jika sudah ada submission terkirim, kembalikan ke draft agar penilaian mencakup laptop baru
        $submittedCount = (int) $pdo->query("SELECT COUNT(*) FROM submissions WHERE status = 'submitted'")->fetchColumn();
        if ($submittedCount > 0) {
            $pdo->exec('DELETE FROM wp_results');
            $pdo->exec("UPDATE submissions SET status = 'draft', sum_weight = NULL, sum_vector_s = NULL, submitted_at = NULL");
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'message' => 'Gagal menambah alternatif: ' . $e->getMessage()], 500);
    }

    $msg = "Alternatif {$data['name']} ({$newId}) berhasil ditambahkan.";
    if ($submittedCount > 0) {
        $msg .= ' Status penilaian sebelumnya dikembalikan ke draft agar laptop baru ikut dinilai.';
    }

    jsonResponse([
        'ok'      => true,
        'message' => $msg,
        'state'   => buildAppState($pdo, $user),
    ]);
}

if ($action === 'delete') {
    $id = trim((string) ($input['id'] ?? ''));
    if ($id === '') {
        jsonResponse(['ok' => false, 'message' => 'ID alternatif tidak valid.'], 400);
    }

    $totalAlts = (int) $pdo->query('SELECT COUNT(*) FROM alternatives')->fetchColumn();
    if ($totalAlts <= 2) {
        jsonResponse(['ok' => false, 'message' => 'Minimal harus ada 2 alternatif laptop untuk dibandingkan.'], 422);
    }

    $check = $pdo->prepare('SELECT name FROM alternatives WHERE id = ?');
    $check->execute([$id]);
    $row = $check->fetch();
    if (!$row) {
        jsonResponse(['ok' => false, 'message' => 'Alternatif tidak ditemukan.'], 404);
    }

    $pdo->beginTransaction();
    try {
        $del = $pdo->prepare('DELETE FROM alternatives WHERE id = ?');
        $del->execute([$id]);

        $submittedCount = (int) $pdo->query("SELECT COUNT(*) FROM submissions WHERE status = 'submitted'")->fetchColumn();
        if ($submittedCount > 0) {
            $pdo->exec('DELETE FROM wp_results');
            $pdo->exec("UPDATE submissions SET status = 'draft', sum_weight = NULL, sum_vector_s = NULL, submitted_at = NULL");
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'message' => 'Gagal menghapus alternatif: ' . $e->getMessage()], 500);
    }

    $msg = "Alternatif {$row['name']} berhasil dihapus.";
    if ($submittedCount > 0) {
        $msg .= ' Penilaian yang sudah terkirim dikembalikan ke draft agar peringkat tetap konsisten.';
    }

    jsonResponse([
        'ok'      => true,
        'message' => $msg,
        'state'   => buildAppState($pdo, $user),
    ]);
}

jsonResponse(['ok' => false, 'message' => 'Aksi alternatif tidak dikenal.'], 400);
