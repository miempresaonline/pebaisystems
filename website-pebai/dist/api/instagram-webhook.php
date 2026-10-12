<?php
/** PEBAI Flow — webhook propio de Instagram. */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/instagram-config.php';
if (!is_file($configFile)) { http_response_code(503); echo json_encode(['status' => 'configuration_required']); exit; }
$config = require $configFile;
if (!is_array($config)) { http_response_code(500); echo json_encode(['status' => 'invalid_configuration']); exit; }

function pebaiLog(array $entry): void {
    $entry['at'] = (new DateTime('now', new DateTimeZone('Europe/Madrid')))->format(DateTimeInterface::ATOM);
    @file_put_contents(__DIR__ . '/instagram-events.log', json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}
function pebaiNormalize(string $value): string {
    $value = trim(mb_strtolower($value, 'UTF-8'));
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    return trim(preg_replace('/\s+/', ' ', $ascii === false ? $value : $ascii) ?? '');
}
function pebaiCampaignFor(string $text, array $campaigns): ?array {
    $normal = pebaiNormalize($text);
    foreach ($campaigns as $name => $campaign) {
        if (empty($campaign['enabled']) || empty($campaign['keywords'])) continue;
        foreach ($campaign['keywords'] as $keyword) {
            $needle = pebaiNormalize((string) $keyword);
            if ($needle !== '' && preg_match('/(^|[^a-z0-9])' . preg_quote($needle, '/') . '($|[^a-z0-9])/', $normal)) {
                $campaign['name'] = $name;
                return $campaign;
            }
        }
    }
    return null;
}
function pebaiRequest(string $url, array $payload, string $token): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE)]);
    $body = curl_exec($ch); $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); $error = curl_error($ch); curl_close($ch);
    return ['status' => $status, 'body' => $body, 'error' => $error];
}
function pebaiSendDirectMessage(array $config, string $recipientId, string $message): array {
    $version = $config['graph_version'] ?? 'v24.0'; $accountId = $config['instagram_account_id'] ?? '';
    return pebaiRequest("https://graph.instagram.com/{$version}/{$accountId}/messages", ['recipient' => ['id' => $recipientId], 'message' => ['text' => $message]], (string) ($config['access_token'] ?? ''));
}
function pebaiSendPrivateCommentReply(array $config, string $commentId, string $recipientId, string $message): array {
    $version = $config['graph_version'] ?? 'v24.0';
    return pebaiRequest("https://graph.instagram.com/{$version}/{$commentId}/private_replies", ['recipient' => ['id' => $recipientId], 'message' => ['text' => $message]], (string) ($config['access_token'] ?? ''));
}
function pebaiSignatureIsValid(string $raw, array $config): bool {
    $secret = (string) ($config['app_secret'] ?? ''); $header = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
    return $secret !== '' && str_starts_with($header, 'sha256=') && hash_equals('sha256=' . hash_hmac('sha256', $raw, $secret), $header);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? ''; $token = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? ''; $challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';
    if ($mode === 'subscribe' && hash_equals((string) ($config['verify_token'] ?? ''), (string) $token)) { header('Content-Type: text/plain; charset=utf-8'); echo $challenge; exit; }
    http_response_code(403); echo json_encode(['status' => 'verification_failed']); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status' => 'method_not_allowed']); exit; }
$raw = file_get_contents('php://input') ?: '';
if (!pebaiSignatureIsValid($raw, $config)) { http_response_code(403); pebaiLog(['event' => 'signature_rejected']); echo json_encode(['status' => 'invalid_signature']); exit; }
$payload = json_decode($raw, true);
if (!is_array($payload)) { http_response_code(400); echo json_encode(['status' => 'invalid_payload']); exit; }

$processed = 0; $sent = 0; $campaigns = is_array($config['campaigns'] ?? null) ? $config['campaigns'] : [];
foreach (($payload['entry'] ?? []) as $entry) {
    foreach (($entry['changes'] ?? []) as $change) {
        if (($change['field'] ?? '') !== 'comments') continue;
        $value = $change['value'] ?? []; $campaign = pebaiCampaignFor((string) ($value['text'] ?? ''), $campaigns); $commentId = (string) ($value['id'] ?? ''); $sender = (string) ($value['from']['id'] ?? '');
        if (!$campaign || $commentId === '' || $sender === '') continue;
        $processed++; $message = str_replace('{{url}}', (string) ($campaign['url'] ?? ''), (string) ($campaign['message'] ?? ''));
        $result = !empty($config['enabled']) ? pebaiSendPrivateCommentReply($config, $commentId, $sender, $message) : ['status' => 202, 'error' => 'dry_run'];
        if ($result['status'] >= 200 && $result['status'] < 300) $sent++;
        pebaiLog(['event' => 'comment_keyword', 'campaign' => $campaign['name'], 'comment_id' => $commentId, 'sender_id' => $sender, 'delivery_status' => $result['status'], 'delivery_error' => $result['error']]);
    }
    foreach (($entry['messaging'] ?? []) as $event) {
        $campaign = pebaiCampaignFor((string) ($event['message']['text'] ?? ''), $campaigns); $sender = (string) ($event['sender']['id'] ?? '');
        if (!$campaign || $sender === '') continue;
        $processed++; $message = str_replace('{{url}}', (string) ($campaign['url'] ?? ''), (string) ($campaign['message'] ?? ''));
        $result = !empty($config['enabled']) ? pebaiSendDirectMessage($config, $sender, $message) : ['status' => 202, 'error' => 'dry_run'];
        if ($result['status'] >= 200 && $result['status'] < 300) $sent++;
        pebaiLog(['event' => 'dm_keyword', 'campaign' => $campaign['name'], 'sender_id' => $sender, 'delivery_status' => $result['status'], 'delivery_error' => $result['error']]);
    }
}
http_response_code(200); echo json_encode(['status' => 'ok', 'processed' => $processed, 'sent' => $sent]);
