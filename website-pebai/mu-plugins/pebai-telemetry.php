<?php
/**
 * Plugin Name: PEBAI Private Server-Side Telemetry
 * Description: Endpoint REST nativo para telemetría B2B privada inmune a Ad-Blockers.
 * Version: 1.0.0
 * Author: PEBAI DevOps
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('PEBAI_TELEMETRY_FILE')) {
    define('PEBAI_TELEMETRY_FILE', WP_CONTENT_DIR . '/uploads/pebai_telemetry.jsonl');
}

add_action('rest_api_init', function () {
    register_rest_route('pebai/v1', '/telemetry', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true',
        'callback'            => function ($request) {
            $params = $request->get_json_params() ?: $request->get_params();
            
            $upload_dir = WP_CONTENT_DIR . '/uploads';
            if (!is_dir($upload_dir)) {
                @wp_mkdir_p($upload_dir);
            }

            $raw_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'anon';
            $anonymized_ip = preg_replace(['/\.\d+$/', '/:[0-9a-fA-F]+$/'], ['.0', ':0000'], $raw_ip);

            $log_entry = [
                'timestamp' => current_time('mysql'),
                'event'     => sanitize_text_field($params['event'] ?? 'unknown'),
                'source'    => esc_url_raw($params['source'] ?? 'direct'),
                'device'    => sanitize_text_field($params['device'] ?? 'desktop'),
                'ip'        => $anonymized_ip,
                'details'   => $params['details'] ?? []
            ];

            @file_put_contents(
                PEBAI_TELEMETRY_FILE,
                json_encode($log_entry, JSON_UNESCAPED_UNICODE) . "\n",
                FILE_APPEND | LOCK_EX
            );

            return new WP_REST_Response(['status' => 'logged'], 200);
        }
    ]);
});
