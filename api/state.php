<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state_builder.php';

$pdo = getDB();
$user = getCurrentUser($pdo);

jsonResponse([
    'ok'    => true,
    'user'  => $user,
    'state' => buildAppState($pdo, $user),
]);
