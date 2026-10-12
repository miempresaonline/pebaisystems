<?php
/*
Plugin Name: PEBAI Security & Anti-Enumeration
Description: Bloqueo de enumeración de usuarios REST API y scans de autor.
Version: 1.0.0
Author: PEBAI DevOps
*/

if (!defined('ABSPATH')) {
    exit;
}

// 1. Bloqueo de endpoints de usuarios en la REST API para usuarios no autenticados
add_filter('rest_endpoints', function ($endpoints) {
    if (!is_user_logged_in()) {
        if (isset($endpoints['/wp/v2/users'])) {
            unset($endpoints['/wp/v2/users']);
        }
        if (isset($endpoints['/wp/v2/users/(?P<id>[\d]+)'])) {
            unset($endpoints['/wp/v2/users/(?P<id>[\d]+)']);
        }
    }
    return $endpoints;
});

// 2. Redirigir consultas ?author=N a la home
add_action('init', function () {
    if (!is_admin() && isset($_GET['author']) && is_numeric($_GET['author'])) {
        wp_redirect(home_url('/'), 301);
        exit;
    }
}, 1);

// 3. Ocultar mensajes que revelen nombres de usuario válidos en pantalla de login
add_filter('login_errors', function () {
    return '<strong>ERROR</strong>: Datos de acceso no válidos.';
});
