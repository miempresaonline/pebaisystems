<?php
/*
 * PEBAI · Envío por el formulario de contacto de la web de la empresa (30/10/2026, decisión de Daniel).
 * Lo usa el agente de email: de las empresas sin móvil, un 60 % va por su formulario y un 40 % por email
 * (cfg 'formularios' + 'form_pct' en _email_lib.php). Mismo texto que el email: se presenta y ofrece la baja.
 * Reglas: nunca se toca un captcha (esa web va por email), no se rellenan campos ocultos trampa y, si queda
 * algún campo obligatorio que no sabemos contestar, no se envía. Las respuestas llegan al buzón del frío.
 */

const PEBAI_FORM_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const PEBAI_FORM_CAPTCHA_RE = '/g-recaptcha|grecaptcha|recaptcha\/api|hcaptcha|cf-turnstile|challenges\.cloudflare\.com\/turnstile|frc-captcha|friendlycaptcha|mtcaptcha|captcha_code|securimage|really-simple-captcha|wpcf7-quiz|cuánto es|cuanto es|resultado de la suma|anti-?spam question/iu';
const PEBAI_FORM_CONTACTO_RE = '/contact|contacta|escr[ií]be|presupuesto|hablamos|habla con|solicita/iu';
const PEBAI_FORM_OK_RE = '/gracias|enviad[oa] (correctamente|con [ée]xito)|mensaje (ha sido )?enviado|hemos recibido|recibido (tu|su) mensaje|nos pondremos en contacto|thank you|message (has been )?sent|successfully|mail_sent|"success":\s*true/iu';
const PEBAI_FORM_ERR_RE = '/error al enviar|no se ha podido enviar|ha ocurrido un error|campo (es )?obligatorio|validation_failed|mail_failed|spam|"success":\s*false|captcha/iu';

/** GET/POST con cookies del mismo dominio. Devuelve [código, cuerpo, url final, tipo]. */
function pebai_form_http(string $url, ?array $post = null, string $cookies = '', array $cab = []): array
{
    $ch = curl_init($url);
    $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 5, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8,
             CURLOPT_USERAGENT => PEBAI_FORM_UA, CURLOPT_ENCODING => '', CURLOPT_COOKIEFILE => '', CURLOPT_SSL_VERIFYPEER => false,
             CURLOPT_HTTPHEADER => array_merge(['Accept-Language: es-ES,es;q=0.9'], $cab)];
    if ($cookies !== '') {
        $opts[CURLOPT_COOKIE] = $cookies;
    }
    if ($post !== null) {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($post);
    }
    curl_setopt_array($ch, $opts);
    $body = (string)curl_exec($ch);
    $res = [(int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE), $body, (string)curl_getinfo($ch, CURLINFO_EFFECTIVE_URL), (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE)];
    curl_close($ch);
    return $res;
}

function pebai_form_abs(string $base, string $href): string
{
    $href = trim(html_entity_decode($href));
    if ($href === '' || str_starts_with($href, '#')) {
        return preg_replace('/#.*$/', '', $base);
    }
    if (preg_match('#^https?://#i', $href)) {
        return $href;
    }
    $p = parse_url($base);
    $raiz = ($p['scheme'] ?? 'https') . '://' . ($p['host'] ?? '');
    if (str_starts_with($href, '//')) {
        return ($p['scheme'] ?? 'https') . ':' . $href;
    }
    if (str_starts_with($href, '/')) {
        return $raiz . $href;
    }
    $dir = preg_replace('#/[^/]*$#', '/', $p['path'] ?? '/');
    return $raiz . $dir . $href;
}

function pebai_form_dom(string $html): DOMDocument
{
    $d = new DOMDocument();
    libxml_use_internal_errors(true);
    $d->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NOWARNING | LIBXML_NOERROR);
    libxml_clear_errors();
    return $d;
}

/** Texto que describe un campo: name, id, placeholder, aria-label y su <label>. */
function pebai_form_pista(DOMElement $e, DOMXPath $x): string
{
    $t = $e->getAttribute('name') . ' ' . $e->getAttribute('id') . ' ' . $e->getAttribute('placeholder') . ' ' . $e->getAttribute('aria-label') . ' ' . $e->getAttribute('type');
    $id = $e->getAttribute('id');
    if ($id !== '') {
        foreach ($x->query('//label[@for="' . str_replace('"', '', $id) . '"]') as $l) {
            $t .= ' ' . $l->textContent;
        }
    }
    for ($p = $e->parentNode; $p instanceof DOMElement && $p->nodeName !== 'form'; $p = $p->parentNode) {
        if ($p->nodeName === 'label') {
            $t .= ' ' . $p->textContent;
            break;
        }
    }
    return mb_strtolower(preg_replace('/\s+/', ' ', $t));
}

/** Campo trampa para bots (oculto con estilo, nombres típicos o tabindex -1): se deja vacío. */
function pebai_form_trampa(DOMElement $e): bool
{
    $estilo = strtolower($e->getAttribute('style') . ' ' . ($e->parentNode instanceof DOMElement ? $e->parentNode->getAttribute('style') . ' ' . $e->parentNode->getAttribute('class') : ''));
    return $e->getAttribute('tabindex') === '-1' || str_contains($estilo, 'display:none') || str_contains($estilo, 'display: none') || str_contains($estilo, 'visibility:hidden')
        || preg_match('/honeypot|hp[-_]|ak_hp|ohnohoney|screen-reader-response/i', $e->getAttribute('name') . ' ' . $e->getAttribute('class') . ' ' . $estilo)
        || $e->getAttribute('aria-hidden') === 'true';
}

/**
 * Busca el formulario de contacto en la web y lo rellena. Devuelve
 * ['ok' => bool, 'motivo' => texto, 'url' => página del formulario, 'tipo' => cf7|elementor|html].
 * $datos: nombre, empresa, email, telefono, asunto, texto. $enviar = false solo analiza (pruebas).
 */
function pebai_form_enviar(string $web, array $datos, bool $enviar = true): array
{
    $web = trim($web);
    if ($web === '') {
        return ['ok' => false, 'motivo' => 'sin web', 'url' => '', 'tipo' => ''];
    }
    if (!preg_match('#^https?://#i', $web)) {
        $web = 'https://' . $web;
    }
    [$cod, $html, $final] = pebai_form_http($web);
    if ($cod >= 400 || $html === '') {
        return ['ok' => false, 'motivo' => "la web no responde ($cod)", 'url' => $web, 'tipo' => ''];
    }
    $paginas = [$final => $html];
    // Páginas de contacto enlazadas desde la portada (máx. 3) y, si no hay, las rutas típicas.
    $host = parse_url($final, PHP_URL_HOST);
    $x = new DOMXPath(pebai_form_dom($html));
    $enl = [];
    foreach ($x->query('//a[@href]') as $a) {
        $u = pebai_form_abs($final, $a->getAttribute('href'));
        if (parse_url($u, PHP_URL_HOST) === $host && preg_match(PEBAI_FORM_CONTACTO_RE, $a->textContent . ' ' . $a->getAttribute('href')) && !preg_match('/\.(pdf|jpe?g|png)$|mailto:|tel:|wa\.me/i', $u)) {
            $enl[$u] = true;
        }
    }
    $enl = array_slice(array_keys($enl), 0, 3);
    if (!$enl) {
        $raiz = preg_replace('#^(https?://[^/]+).*$#', '$1', $final);
        $enl = [$raiz . '/contacto/', $raiz . '/contacto'];
    }
    foreach ($enl as $u) {
        if (!isset($paginas[$u])) {
            [$c2, $h2, $f2] = pebai_form_http($u);
            if ($c2 < 400 && $h2 !== '') {
                $paginas[$f2] = $h2;
            }
        }
    }
    $visto = '';
    // La página de contacto antes que la portada
    foreach (array_reverse($paginas, true) as $url => $h) {
        $r = pebai_form_en_pagina($url, $h, $datos, $enviar);
        if ($r['ok'] || $r['motivo'] !== 'sin formulario de contacto') {
            return $r;
        }
        $visto = $url;
    }
    return ['ok' => false, 'motivo' => 'sin formulario de contacto', 'url' => $visto, 'tipo' => ''];
}

function pebai_form_en_pagina(string $url, string $html, array $datos, bool $enviar): array
{
    $dom = pebai_form_dom($html);
    $x = new DOMXPath($dom);
    foreach ($x->query('//form') as $form) {
        /** @var DOMElement $form */
        $tieneTexto = $x->query('.//textarea', $form)->length > 0;
        $tieneEmail = false;
        foreach ($x->query('.//input', $form) as $i) {
            if ($i->getAttribute('type') === 'email' || preg_match('/mail/i', $i->getAttribute('name'))) {
                $tieneEmail = true;
            }
        }
        if (!$tieneTexto || !$tieneEmail || preg_match('/search|login|newsletter|comment/i', $form->getAttribute('class') . ' ' . $form->getAttribute('id') . ' ' . $form->getAttribute('action'))) {
            continue;
        }
        $base = ['url' => $url, 'tipo' => ''];
        // Captcha en el formulario o en la página: no se toca
        if (preg_match(PEBAI_FORM_CAPTCHA_RE, $dom->saveHTML($form)) || preg_match('/g-recaptcha|hcaptcha|cf-turnstile|recaptcha\/api\.js\?render=/i', $html)) {
            return $base + ['ok' => false, 'motivo' => 'tiene captcha'];
        }
        if (preg_match('/wpforms-form|gform_wrapper|gform_fields|ninja-forms|frm-show-form|hs-form|typeform|jotform/i', $dom->saveHTML($form))) {
            return $base + ['ok' => false, 'motivo' => 'formulario que solo funciona con JavaScript'];
        }
        // Rellenar campos
        $campos = [];
        $boton = null;
        $sinSaber = [];
        $usado = ['nombre' => false, 'email' => false, 'texto' => false];
        foreach ($x->query('.//input|.//textarea|.//select', $form) as $e) {
            /** @var DOMElement $e */
            $n = $e->getAttribute('name');
            if ($n === '' || $e->hasAttribute('disabled')) {
                continue;
            }
            $tipo = strtolower($e->getAttribute('type') ?: ($e->nodeName === 'textarea' ? 'textarea' : ($e->nodeName === 'select' ? 'select' : 'text')));
            $obligatorio = $e->hasAttribute('required') || $e->getAttribute('aria-required') === 'true' || preg_match('/required|obligatori/i', $e->getAttribute('class'));
            if ($tipo === 'hidden') {
                $campos[$n] = $e->getAttribute('value');
                continue;
            }
            if (in_array($tipo, ['submit', 'button', 'reset', 'image', 'file'], true)) {
                // El botón de enviar viaja con el formulario, como en un navegador (ASP.NET y otros lo necesitan)
                if ($tipo === 'submit' && !isset($boton)) {
                    $boton = [$n, $e->getAttribute('value')];
                }
                if ($tipo === 'file' && $obligatorio) {
                    $sinSaber[] = 'adjunto';
                }
                continue;
            }
            if (pebai_form_trampa($e)) {
                $campos[$n] = '';
                continue;
            }
            $p = pebai_form_pista($e, $x);
            if ($tipo === 'checkbox' || $tipo === 'radio') {
                if (preg_match('/privacidad|privacy|acepto|aceptar|legal|rgpd|gdpr|lopd|condiciones|consent|pol[ií]tica/u', $p)) {
                    $campos[$n] = $e->getAttribute('value') !== '' ? $e->getAttribute('value') : 'on';
                } elseif ($obligatorio && $tipo === 'radio' && !isset($campos[$n])) {
                    $campos[$n] = $e->getAttribute('value');
                } elseif ($obligatorio) {
                    $sinSaber[] = trim($p);
                }
                continue;
            }
            if ($tipo === 'select') {
                $elegida = null;
                foreach ($x->query('.//option', $e) as $o) {
                    $v = $o->hasAttribute('value') ? $o->getAttribute('value') : trim($o->textContent);
                    if ($v === '' || $o->hasAttribute('disabled')) {
                        continue;
                    }
                    if ($elegida === null || preg_match('/otr|consulta|informaci|general|colabora/iu', $o->textContent)) {
                        $elegida = $v;
                        if (preg_match('/otr|consulta|informaci|general|colabora/iu', $o->textContent)) {
                            break;
                        }
                    }
                }
                if ($elegida !== null) {
                    $campos[$n] = $elegida;
                } elseif ($obligatorio) {
                    $sinSaber[] = trim($p);
                }
                continue;
            }
            $v = null;
            if ($tipo === 'textarea' || preg_match('/mensaje|message|comentario|consulta|your-message|descripci|texto|observaciones/u', $p)) {
                $v = $datos['texto'];
                $usado['texto'] = true;
            } elseif ($tipo === 'email' || preg_match('/e-?mail|correo/u', $p)) {
                $v = $datos['email'];
                $usado['email'] = true;
            } elseif ($tipo === 'tel' || preg_match('/tel[eé]f|phone|m[oó]vil|movil|celular/u', $p)) {
                $v = $datos['telefono'];
            } elseif (preg_match('/asunto|subject|motivo/u', $p)) {
                $v = $datos['asunto'];
            } elseif (preg_match('/empresa|company|compa[ñn][ií]a|negocio|raz[oó]n social/u', $p)) {
                $v = $datos['empresa'];
            } elseif (preg_match('/apellido|last.?name|surname/u', $p)) {
                $v = $datos['empresa'];
            } elseif (preg_match('/nombre|name|your-name/u', $p)) {
                $v = $datos['nombre'];
                $usado['nombre'] = true;
            } elseif (preg_match('/web|url|sitio/u', $p)) {
                $v = 'https://pebaisystems.es';
            } elseif (preg_match('/ciudad|localidad|poblaci|provincia|city/u', $p)) {
                $v = 'Madrid';
            } elseif (preg_match('/postal|zip|c\.?p/u', $p)) {
                $v = '28001';
            }
            if ($v === null) {
                if ($obligatorio) {
                    $sinSaber[] = trim($p);
                }
                continue;
            }
            $campos[$n] = $v;
        }
        if (!$usado['texto'] || !$usado['email']) {
            continue;
        }
        if ($sinSaber) {
            return $base + ['ok' => false, 'motivo' => 'pide datos que no sabemos poner: ' . mb_substr(implode(' | ', $sinSaber), 0, 160)];
        }
        $clase = $form->getAttribute('class');
        $accion = pebai_form_abs($url, $form->getAttribute('action'));
        $metodo = strtolower($form->getAttribute('method') ?: 'get');
        // Contact Form 7: su API (lo mismo que hace su JavaScript)
        if (isset($campos['_wpcf7'])) {
            $base['tipo'] = 'cf7';
            if (!$enviar) {
                return $base + ['ok' => true, 'motivo' => 'listo (prueba, no enviado)'];
            }
            $raiz = preg_replace('#^(https?://[^/]+).*$#', '$1', $url);
            [$c, $b] = pebai_form_http($raiz . '/wp-json/contact-form-7/v1/contact-forms/' . (int)$campos['_wpcf7'] . '/feedback', $campos, '', ['Accept: application/json']);
            $j = json_decode($b, true);
            if (is_array($j) && isset($j['status'])) {
                return $base + ['ok' => $j['status'] === 'mail_sent', 'motivo' => $j['status'] === 'mail_sent' ? 'enviado' : 'no lo acepta: ' . $j['status'] . ' ' . mb_substr(strip_tags((string)($j['message'] ?? '')), 0, 120)];
            }
            [$c, $b] = pebai_form_http($accion, $campos);
            return $base + pebai_form_resultado($c, $b);
        }
        // Elementor Pro: por admin-ajax, como su JavaScript
        if (str_contains($clase, 'elementor-form')) {
            $base['tipo'] = 'elementor';
            if (!$enviar) {
                return $base + ['ok' => true, 'motivo' => 'listo (prueba, no enviado)'];
            }
            $raiz = preg_replace('#^(https?://[^/]+).*$#', '$1', $url);
            [$c, $b] = pebai_form_http($raiz . '/wp-admin/admin-ajax.php', $campos + ['action' => 'elementor_pro_forms_send_form', 'referrer' => $url], '', ['X-Requested-With: XMLHttpRequest']);
            $j = json_decode($b, true);
            return $base + (is_array($j) && isset($j['success']) ? ['ok' => (bool)$j['success'], 'motivo' => $j['success'] ? 'enviado' : 'no lo acepta: ' . mb_substr(json_encode($j['data'] ?? '', JSON_UNESCAPED_UNICODE), 0, 140)]
                                                                 : pebai_form_resultado($c, $b));
        }
        $base['tipo'] = 'html';
        if ($boton && !isset($campos[$boton[0]])) {
            $campos[$boton[0]] = $boton[1];
        }
        if (!$enviar) {
            return $base + ['ok' => true, 'motivo' => 'listo (prueba, no enviado)'];
        }
        if ($metodo === 'get') {
            [$c, $b] = pebai_form_http($accion . (str_contains($accion, '?') ? '&' : '?') . http_build_query($campos));
        } else {
            [$c, $b] = pebai_form_http($accion, $campos, '', ['Referer: ' . $url]);
        }
        return $base + pebai_form_resultado($c, $b);
    }
    return ['ok' => false, 'motivo' => 'sin formulario de contacto', 'url' => $url, 'tipo' => ''];
}

/** Lee la respuesta de un envío clásico: confirmado, rechazado o aceptado sin confirmación. */
function pebai_form_resultado(int $cod, string $body): array
{
    $t = mb_substr(preg_replace('/\s+/', ' ', strip_tags(preg_replace('#<(script|style)\b.*?</\1>#is', '', $body))), 0, 20000);
    if ($cod >= 400) {
        return ['ok' => false, 'motivo' => "la web devolvió un error ($cod)"];
    }
    if (preg_match(PEBAI_FORM_OK_RE, $t) && !preg_match(PEBAI_FORM_ERR_RE, $t)) {
        return ['ok' => true, 'motivo' => 'enviado'];
    }
    if (preg_match(PEBAI_FORM_ERR_RE, $t)) {
        return ['ok' => false, 'motivo' => 'la web rechazó el envío'];
    }
    // Aceptado sin mensaje claro: puede haber llegado, así que cuenta como enviado (no se le escribe además por email)
    return ['ok' => true, 'motivo' => 'enviado (la web no muestra confirmación)'];
}
