<?php
require_once __DIR__ . '/config.php';
handleCors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $code = trim($input['code'] ?? '');
    $participantName = trim($input['participant_name'] ?? '');
    $availability = $input['availability'] ?? null;
    $comment = trim($input['comment'] ?? '');
    $isEdit = !empty($input['is_edit']);

    if ($code === '' || $participantName === '' || !is_array($availability)) {
        jsonResponse(['error' => 'Code, participant name, and availability are required.'], 400);
    }

    if (mb_strlen($participantName) > 100) {
        jsonResponse(['error' => 'Name is too long.'], 400);
    }

    $db = getDB();

    $stmt = $db->prepare('SELECT id FROM events WHERE code = ?');
    $stmt->execute([$code]);
    $event = $stmt->fetch();

    if (!$event) {
        jsonResponse(['error' => 'Event not found.'], 404);
    }

    $eventId = (int)$event['id'];
    $availabilityJson = json_encode($availability);

    $stmt = $db->prepare(
        'INSERT INTO responses (event_id, participant_name, availability, comment) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE availability = VALUES(availability), comment = VALUES(comment), updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([$eventId, $participantName, $availabilityJson, $comment ?: null]);

    // Only send email notification for NEW responses, not edits
    if (!$isEdit) {
        $stmt = $db->prepare('SELECT name, code, creator_email FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $eventData = $stmt->fetch();

        if (!empty($eventData['creator_email'])) {
            $eventName = htmlspecialchars($eventData['name']);
            $participantNameSafe = htmlspecialchars($participantName);
            $summaryUrl = APP_BASE_URL . '/#/' . $eventData['code'] . '/results';
            $logoUrl = APP_BASE_URL . '/logo-black.png';
            $unsubscribeUrl = APP_BASE_URL . '/api/unsubscribe.php?code=' . urlencode($eventData['code']) . '&email=' . urlencode($eventData['creator_email']);

            $subject = "=?UTF-8?B?" . base64_encode("New response for \"" . $eventData['name'] . "\"") . "?=";
            $htmlBody = <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <img src="{$logoUrl}" alt="MeetUp" style="height: 28px; margin-bottom: 24px;" />
    <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #18181b;">New response from {$participantNameSafe}</h2>
    <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;">Someone responded to your event <strong>{$eventName}</strong>.</p>
    <a href="{$summaryUrl}" style="display: inline-block; padding: 10px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">View Results</a>
    <p style="margin: 32px 0 0 0; font-size: 11px; color: #a1a1aa; text-align: center;">
      <a href="{$unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">I don't want to receive these notifications</a>
    </p>
  </div>
</body>
</html>
HTML;

            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: MeetUp <noreply@filiprosa.cz>\r\n";

            @mail($eventData['creator_email'], $subject, $htmlBody, $headers);
        }
    }

    jsonResponse(['success' => true]);
}

if ($method === 'GET') {
    $code = $_GET['code'] ?? '';
    $name = $_GET['name'] ?? '';

    if ($code === '' || $name === '') {
        jsonResponse(['error' => 'Code and name are required.'], 400);
    }

    $db = getDB();

    $stmt = $db->prepare('SELECT id FROM events WHERE code = ?');
    $stmt->execute([$code]);
    $event = $stmt->fetch();

    if (!$event) {
        jsonResponse(['error' => 'Event not found.'], 404);
    }

    $stmt = $db->prepare('SELECT COUNT(*) FROM responses WHERE event_id = ? AND participant_name = ?');
    $stmt->execute([$event['id'], $name]);
    $exists = (int)$stmt->fetchColumn() > 0;

    jsonResponse(['exists' => $exists]);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
