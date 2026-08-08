<?php
require_once __DIR__ . '/config.php';
handleCors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $creatorName = trim($input['creator_name'] ?? '');
    $creatorEmail = trim($input['creator_email'] ?? '');
    $dateFrom = trim($input['date_from'] ?? '');
    $dateTo = trim($input['date_to'] ?? '');

    if ($name === '') {
        jsonResponse(['error' => 'Event name is required.'], 400);
    }

    if ($dateFrom === '' || $dateTo === '') {
        jsonResponse(['error' => 'Date range is required.'], 400);
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
        jsonResponse(['error' => 'Invalid date format.'], 400);
    }

    if ($dateFrom > $dateTo) {
        jsonResponse(['error' => 'Start date must be before end date.'], 400);
    }

    $from = new DateTime($dateFrom);
    $to = new DateTime($dateTo);
    if ($from->diff($to)->days > 92) {
        jsonResponse(['error' => 'Date range cannot exceed 3 months.'], 400);
    }

    if ($creatorEmail !== '' && !filter_var($creatorEmail, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Invalid email address.'], 400);
    }

    $db = getDB();

    $maxAttempts = 10;
    for ($i = 0; $i < $maxAttempts; $i++) {
        $code = generateCode();
        $stmt = $db->prepare('SELECT COUNT(*) FROM events WHERE code = ?');
        $stmt->execute([$code]);
        if ((int)$stmt->fetchColumn() === 0) {
            break;
        }
        if ($i === $maxAttempts - 1) {
            jsonResponse(['error' => 'Could not generate unique code.'], 500);
        }
    }

    $stmt = $db->prepare(
        'INSERT INTO events (code, name, description, creator_name, creator_email, date_from, date_to) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $code,
        $name,
        $description ?: null,
        $creatorName ?: null,
        $creatorEmail ?: null,
        $dateFrom,
        $dateTo,
    ]);

    jsonResponse(['code' => $code], 201);
}

if ($method === 'GET') {
    $code = $_GET['code'] ?? '';

    if ($code === '') {
        jsonResponse(['error' => 'Event code is required.'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM events WHERE code = ?');
    $stmt->execute([$code]);
    $event = $stmt->fetch();

    if (!$event) {
        jsonResponse(['error' => 'Event not found.'], 404);
    }

    $stmt = $db->prepare('SELECT id, participant_name, availability, comment, updated_at FROM responses WHERE event_id = ? ORDER BY updated_at ASC');
    $stmt->execute([$event['id']]);
    $responses = $stmt->fetchAll();

    foreach ($responses as &$r) {
        $r['availability'] = json_decode($r['availability'], true);
    }

    $event['responses'] = $responses;
    unset($event['id']);
    unset($event['creator_email']);

    jsonResponse($event);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
