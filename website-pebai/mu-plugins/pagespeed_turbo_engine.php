<?php
/*
Plugin Name: PEBAI Ultra Performance & Script Defer
Description: Carga diferida de scripts pesados, preconnect de fuentes y eliminación total de TBT y CLS.
Version: 1.0.0
Author: PEBAI DevOps
*/

if (!defined('ABSPATH')) {
    exit;
}

// 1. Preconnect inmediato de recursos críticos
add_action('wp_head', function() {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 1);

// 2. Inyección diferida inteligente de Clarity y Scripts de Terceros tras interacción real
add_action('wp_footer', function() {
    $clarity_id = defined('PEBAI_CLARITY_ID') ? PEBAI_CLARITY_ID : 'yjwe6ir50h';
    ?>
    <script id="pebai-deferred-scripts">
    (function() {
        var loaded = false;
        function loadThirdParty() {
            if (loaded) return;
            loaded = true;
            
            // Eliminar listeners
            ['scroll', 'keydown', 'mousemove', 'touchstart', 'click'].forEach(function(e) {
                window.removeEventListener(e, loadThirdParty, {passive: true});
            });

            // Cargar Microsoft Clarity dinámicamente si hay ID configurado
            var clarityId = "<?php echo esc_js($clarity_id); ?>";
            if (clarityId && clarityId !== "TU_CLARITY_ID_AQUI") {
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", clarityId);
            }
        }

        ['scroll', 'keydown', 'mousemove', 'touchstart', 'click'].forEach(function(e) {
            window.addEventListener(e, loadThirdParty, {passive: true, once: true});
        });
    })();
    </script>
    <?php
}, 99);

// 3. Eliminar emojis de WordPress y bloat innecesario para PageSpeed 100
add_action('init', function() {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_filter('the_content_feed', 'wp_staticize_emoji');
    remove_filter('comment_text_rss', 'wp_staticize_emoji');
    remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
});
