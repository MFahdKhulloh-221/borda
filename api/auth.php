<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state_builder.php';

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $user = getCurrentUser($pdo);
    $users = fetchUsers($pdo);
    jsonResponse([
        'ok'    => true,
        'user'  => $user,
        'users' => $users,
    ]);
}

if ($method !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Method tidak didukung.'], 405);
}

$input = getJsonInput();
$action = (string) ($input['action'] ?? 'login');

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();
    jsonResponse(['ok' => true, 'message' => 'Berhasil logout.']);
}

if ($action === 'quick-login') {
    $username = trim((string) ($input['username'] ?? ''));
    if ($username === '') {
        jsonResponse(['ok' => false, 'message' => 'Akun tidak valid.'], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT id, username, name, role, rank_level, icon, focus
         FROM users
         WHERE username = ?'
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['ok' => false, 'message' => 'Akun tidak ditemukan di database.'], 404);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];

    $user['id'] = (int) $user['id'];
    $user['rank'] = (int) $user['rank_level'];

    jsonResponse([
        'ok'      => true,
        'user'    => $user,
        'state'   => buildAppState($pdo, $user),
        'message' => "Selamat datang, {$user['name']}!",
    ]);
}

if ($action === 'login') {
    $username = trim((string) ($input['username'] ?? ''));
    $password = (string) ($input['password'] ?? '');

    if ($username === '' || $password === '') {
        jsonResponse(['ok' => false, 'message' => 'Username dan password wajib diisi.'], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT id, username, password_hash, name, role, rank_level, icon, focus
         FROM users
         WHERE username = ?'
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['ok' => false, 'message' => 'Username atau password salah.'], 401);
    }

    unset($user['password_hash']);
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];

    $user['id'] = (int) $user['id'];
    $user['rank'] = (int) $user['rank_level'];

    jsonResponse([
        'ok'      => true,
        'user'    => $user,
        'state'   => buildAppState($pdo, $user),
        'message' => "Selamat datang, {$user['name']}!",
    ]);
}

jsonResponse(['ok' => false, 'message' => 'Aksi autentikasi tidak dikenal.'], 400);
