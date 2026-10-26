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
    // Clave rápida: solo vale desde la casilla que abre el atajo Ctrl + 5 × Espacio en el login
    'panel_password_atajo_hash' => '',
    // Secreto del webhook de Cal.com (mismo valor en Cal.com)
    'calcom_webhook_secret' => '',
    // Token para lanzar api/recordatorios.php por URL desde el cron de Hostinger
    'cron_token' => '',
    // Token del agente de WhatsApp (agente-whatsapp/): el mismo valor que AGENT_TOKEN en su .env
    'agent_token' => '',
    // Agente de email en frío (api/email-cron.php). Buzón SOLO para el frío, nunca el del embudo (smtp.user).
    // Mejor en un subdominio (p. ej. daniel@hola.pebaisystems.es). Sin user/pass el agente no envía nada.
    'email_frio' => [
        'user' => '',
        'pass' => '',
        'from_name' => 'Daniel · PEBAI Systems',
        'smtp_host' => 'smtp.hostinger.com', 'smtp_port' => 465, 'smtp_secure' => 'ssl',
        'imap' => '{imap.hostinger.com:993/imap/ssl}',
        'enviados' => 'INBOX.Sent',     // carpeta de enviados (para ver el hilo completo en el buzón); '' = no guardar copia
        'avisar_a' => '',               // dónde avisar al momento de cada respuesta (p. ej. el email de Daniel)
    ],
    // Meta: API de Conversiones (eventos Lead y Schedule desde el servidor). Sin capi_token no se envía nada.
    // test_event_code: solo para probar en el Administrador de eventos › Probar eventos; vacío en producción.
    'meta' => [
        'pixel_id' => '1097490073163217',
        'capi_token' => '',
        'test_event_code' => '',
        'api_version' => 'v24.0',
    ],
    'salt' => '',
];
