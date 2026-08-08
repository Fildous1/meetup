<?php
require_once __DIR__ . '/config.php';

$code = trim($_GET['code'] ?? '');
$email = trim($_GET['email'] ?? '');

if ($code === '' || $email === '') {
    http_response_code(400);
    echo '<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 40px; text-align: center;"><p>Invalid request.</p></body></html>';
    exit;
}

$db = getDB();

$stmt = $db->prepare('SELECT id, creator_email FROM events WHERE code = ?');
$stmt->execute([$code]);
$event = $stmt->fetch();

if (!$event || $event['creator_email'] !== $email) {
    http_response_code(404);
    echo '<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 40px; text-align: center;"><p>Event not found or email does not match.</p></body></html>';
    exit;
}

$stmt = $db->prepare('UPDATE events SET creator_email = NULL WHERE id = ?');
$stmt->execute([$event['id']]);

echo <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; background: #f4f4f5; text-align: center;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #18181b;">Unsubscribed</h2>
    <p style="color: #71717a; font-size: 14px; margin: 0;">You will no longer receive email notifications for this event.</p>
  </div>
</body>
</html>
HTML;
