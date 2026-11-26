<?php
declare(strict_types=1);

/**
 * Modul Perhitungan GDSS (Sisi Server PHP):
 * 1. Weighted Product (WP) untuk peringkat individu setiap Decision Maker
 * 2. Metode Borda untuk agregasi konsensus kelompok
 */

const GDSS_EPS = 1e-12;

/**
 * Memberi peringkat (descending berdasarkan nilai V) dan poin Borda.
 * Peringkat 1 = n poin ... peringkat n = 1 poin.
 * Jika terjadi nilai V sama persis (seri), peringkat sama dan poin Borda dirata-rata.
 *
 * @param array<int, array<string, mixed>> $rows
 * @return array<int, array<string, mixed>>
 */
function assignRanksAndPoints(array $rows): array
{
    $n = count($rows);
    $indices = array_keys($rows);

    usort($indices, static function (int $ia, int $ib) use ($rows): int {
        $diff = $rows[$ib]['V'] <=> $rows[$ia]['V'];
        if ($diff !== 0) {
            return $diff;
        }
        return strcmp((string) $rows[$ia]['name'], (string) $rows[$ib]['name']);
    });

    $i = 0;
    while ($i < $n) {
        $j = $i + 1;
        while ($j < $n && abs($rows[$indices[$j]]['V'] - $rows[$indices[$i]]['V']) < GDSS_EPS) {
            $j++;
        }

        $pointSum = 0.0;
        for ($k = $i; $k < $j; $k++) {
            $pointSum += ($n - $k);
        }
        $avgPoints = $pointSum / ($j - $i);

        for ($k = $i; $k < $j; $k++) {
            $idx = $indices[$k];
            $rows[$idx]['rank'] = $i + 1;
            $rows[$idx]['points'] = $avgPoints;
        }
        $i = $j;
    }

    return $rows;
}

/**
 * Menghitung Weighted Product (WP).
 *
 * @param array<string, int|float>         $weights  ['C1' => 5, ...]
 * @param array<string, array<string,int>> $scores   ['A1' => ['C1' => 2, ...], ...]
 * @param array<int, array<string, mixed>> $criteria Daftar kriteria dari database
 * @param array<int, array<string, mixed>> $alts     Daftar alternatif dari database
 * @return array<string, mixed>
 * @throws InvalidArgumentException
 */
function computeWP(array $weights, array $scores, array $criteria, array $alts): array
{
    if (count($alts) < 2) {
        throw new InvalidArgumentException('Minimal harus ada 2 alternatif laptop untuk dihitung.');
    }

    $sumW = 0.0;
    foreach ($criteria as $c) {
        $cid = $c['id'];
        if (!isset($weights[$cid]) || !is_numeric($weights[$cid])) {
            throw new InvalidArgumentException("Bobot kriteria {$c['name']} belum diisi (harus angka 1-5).");
        }
        $w = (float) $weights[$cid];
        if (!is_finite($w) || $w < 1 || $w > 5 || floor($w) !== $w) {
            throw new InvalidArgumentException("Bobot kriteria {$c['name']} harus bilangan bulat 1-5.");
        }
        $sumW += $w;
    }

    if ($sumW <= 0) {
        throw new InvalidArgumentException('Total bobot tidak boleh nol.');
    }

    $W = [];
    $exponents = [];
    foreach ($criteria as $c) {
        $cid = $c['id'];
        $W[$cid] = ((float) $weights[$cid]) / $sumW;
        $exponents[$cid] = ($c['type'] === 'cost') ? -$W[$cid] : $W[$cid];
    }

    $rows = [];
    $sumS = 0.0;
    foreach ($alts as $a) {
        $aid = $a['id'];
        $S = 1.0;
        $x = [];
        $terms = [];

        foreach ($criteria as $c) {
            $cid = $c['id'];
            if (!isset($scores[$aid][$cid]) || !is_numeric($scores[$aid][$cid])) {
                throw new InvalidArgumentException("Nilai {$a['name']} pada {$c['name']} belum diisi (harus angka 1-5).");
            }
            $val = (float) $scores[$aid][$cid];
            if (!is_finite($val) || $val < 1 || $val > 5 || floor($val) !== $val) {
                throw new InvalidArgumentException("Nilai {$a['name']} pada {$c['name']} harus bilangan bulat 1-5.");
            }
            $x[$cid] = (int) $val;
            $term = pow($val, $exponents[$cid]);
            $terms[$cid] = $term;
            $S *= $term;
        }

        if (!is_finite($S) || $S <= 0) {
            throw new InvalidArgumentException("Perhitungan vektor S untuk {$a['name']} tidak valid.");
        }

        $sumS += $S;
        $rows[] = [
            'altId' => $aid,
            'name'  => $a['name'],
            'x'     => $x,
            'terms' => $terms,
            'S'     => $S,
            'V'     => 0.0,
            'rank'  => 0,
            'points'=> 0.0,
        ];
    }

    if (!is_finite($sumS) || $sumS <= 0) {
        throw new InvalidArgumentException('Total vektor S tidak valid (pembagian nol).');
    }

    foreach ($rows as &$r) {
        $r['V'] = $r['S'] / $sumS;
    }
    unset($r);

    $rows = assignRanksAndPoints($rows);

    return [
        'W'         => $W,
        'exponents' => $exponents,
        'sumW'      => $sumW,
        'sumS'      => $sumS,
        'rows'      => $rows,
    ];
}

/**
 * Menghitung Konsensus Borda dari hasil WP seluruh Decision Maker.
 *
 * @param array<int, array<string, mixed>>                   $alts
 * @param array<int, array<string, mixed>>                   $users
 * @param array<string, array<string, array<string, mixed>>> $wpByUser [username => [altId => ['rank' => int, 'points' => float]]]
 * @param string                                             $headUsername
 * @return array<string, mixed>
 * @throws InvalidArgumentException
 */
function computeBorda(array $alts, array $users, array $wpByUser, string $headUsername): array
{
    if (count($wpByUser) !== count($users)) {
        throw new InvalidArgumentException('Seluruh Decision Maker harus sudah mengirim penilaian.');
    }

    $rows = [];
    $grandTotal = 0.0;

    foreach ($alts as $a) {
        $aid = $a['id'];
        $points = [];
        $ranks = [];
        $total = 0.0;

        foreach ($users as $u) {
            $uname = $u['username'];
            if (!isset($wpByUser[$uname][$aid])) {
                throw new InvalidArgumentException(
                    "Data penilaian {$u['name']} tidak lengkap untuk {$a['name']}. Minta DM mengirim ulang."
                );
            }
            $r = $wpByUser[$uname][$aid];
            $points[$uname] = (float) $r['points'];
            $ranks[$uname]  = (int) $r['rank'];
            $total += (float) $r['points'];
        }

        $grandTotal += $total;
        $rows[] = [
            'altId'  => $aid,
            'name'   => $a['name'],
            'points' => $points,
            'ranks'  => $ranks,
            'total'  => $total,
            'weight' => 0.0,
            'finalRank' => 0,
        ];
    }

    if ($grandTotal <= 0) {
        throw new InvalidArgumentException('Total poin Borda nol.');
    }

    foreach ($rows as &$r) {
        $r['weight'] = $r['total'] / $grandTotal;
    }
    unset($r);

    // Urutkan: total poin tertinggi; jika seri, peringkat versi Kepala Lab yang menentukan; lalu nama.
    usort($rows, static function (array $a, array $b) use ($headUsername): int {
        if (abs($b['total'] - $a['total']) >= GDSS_EPS) {
            return $b['total'] <=> $a['total'];
        }
        $rankA = $a['ranks'][$headUsername] ?? 99;
        $rankB = $b['ranks'][$headUsername] ?? 99;
        if ($rankA !== $rankB) {
            return $rankA <=> $rankB;
        }
        return strcmp($a['name'], $b['name']);
    });

    foreach ($rows as $i => &$r) {
        $r['finalRank'] = $i + 1;
    }
    unset($r);

    $tieAtTop = count($rows) > 1 && abs($rows[0]['total'] - $rows[1]['total']) < GDSS_EPS;

    return [
        'grandTotal' => $grandTotal,
        'rows'       => $rows,
        'winnerId'   => $rows[0]['altId'],
        'tieAtTop'   => $tieAtTop,
    ];
}
