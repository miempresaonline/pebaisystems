<?php
/*
Plugin Name: PEBAI Official WhatsApp Conversion Redirect
Description: Redirección 302 directa desde /contacto/ y /contact/ hacia el canal oficial de WhatsApp.
Version: 1.0.0
Author: PEBAI DevOps
*/

if (!defined('ABSPATH')) {
    exit;
}

add_action('template_redirect', function() {
    if (!is_admin() && (
        is_page('contacto') || 
        is_page('contact') || 
        (isset($_SERVER['REQUEST_URI']) && preg_match('#^/contact(o)?(/|\?.*)?$#i', $_SERVER['REQUEST_URI']))
    )) {
        $msg = rawurlencode('Hola, vengo de la web y me gustaría solicitar una consultoría sobre IA para mi empresa.');
        wp_redirect('https://wa.me/34624842799?text=' . $msg, 302);
        exit;
    }
});
