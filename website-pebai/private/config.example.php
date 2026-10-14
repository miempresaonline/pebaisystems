<?php
// PEBAI · Plantilla de configuración privada. Copiar a config.php y rellenar.
// En el servidor va en: domains/pebaisystems.es/private/config.php (fuera de public_html)
return [
    'notify_to' => 'equipo@pebaisystems.es',
    'smtp' => [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'user' => 'equipo@pebaisystems.es',
        'pass' => '',
        'from_name' => 'PEBAI · Formulario web',
    ],
    // php -r "echo password_hash('CONTRASEÑA', PASSWORD_DEFAULT);"
    'panel_password_hash' => '',
    // Secreto del webhook de Cal.com (mismo valor en Cal.com)
    'calcom_webhook_secret' => '',
    // Token para lanzar api/recordatorios.php por URL desde el cron de Hostinger
    'cron_token' => '',
    'salt' => '',
];
