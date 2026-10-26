/*
 * PEBAI · Consentimiento de cookies
 * Muestra el aviso de cookies y solo carga la analítica (Microsoft Clarity y
 * Google Analytics 4) y el píxel de Meta si el visitante los acepta. Sin dependencias.
 *
 * Elección guardada en localStorage['pebai_consent'] = {v:2, analytics:bool, ads:bool, ts:ISO}
 * (caduca a los 12 meses). Una elección v1 (solo analítica) se respeta, pero se vuelve
 * a preguntar por la publicidad.
 * API: window.PEBAI_CONSENT.open(), .analyticsAllowed(), .adsAllowed(), .metaIds()
 * Evento: document 'pebai:consent' con detail {analytics:bool, ads:bool}
 * Eventos de Meta desde cualquier página: (window.pebaiAds = window.pebaiAds || []).push([evento, params, eventId])
 * (solo se envían si se aceptó la publicidad).
 */
(function () {
  'use strict';

  if (window.PEBAI_CONSENT) return;

  var KEY = 'pebai_consent';
  var VERSION = 2;
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  var CLARITY_ID = 'yjwe6ir50h';
  var GA4_ID = 'G-2QFM6HCTWV';
  var META_PIXEL_ID = '1097490073163217';
  var POLICY_URL = '/politica-de-cookies/';
  var SHOW_DELAY_MS = 6000;
  var ANALYTICS_COOKIES = ['_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM', '_ga', '_gid', '_gat'];
  var ADS_COOKIES = ['_fbp', '_fbc'];

  var isPanel = /^\/panel(\/|$)/.test(window.location.pathname) || /^panel\./.test(window.location.hostname);
  var loaded = false;
  var adsLoaded = false;
  var banner = null;
  var lastFocus = null;

  // ads: true/false, o null si la elección es anterior a la publicidad (v1) y hay que volver a preguntar.
  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (!c || (c.v !== VERSION && c.v !== 1) || typeof c.analytics !== 'boolean') return null;
      var t = Date.parse(c.ts);
      if (!t || Date.now() - t > MAX_AGE_MS) return null;
      return { analytics: c.analytics, ads: c.v === VERSION && typeof c.ads === 'boolean' ? c.ads : null };
    } catch (e) { return null; }
  }

  function write(analytics, ads) {
    var c = { v: VERSION, analytics: !!analytics, ads: !!ads, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  function analyticsAllowed() {
    var c = read();
    return !!(c && c.analytics);
  }

  function adsAllowed() {
    var c = read();
    return !!(c && c.ads);
  }

  function cookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function deleteCookies(names) {
    var host = window.location.hostname;
    var parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function loadAnalytics() {
    if (loaded || isPanel) return;
    loaded = true;

    // Microsoft Clarity (snippet oficial)
    if (!document.querySelector('script[src*="clarity.ms/tag"]')) {
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", CLARITY_ID);
    }
    // Consent API v2 de Clarity: analítica sí, publicidad no.
    try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {}

    // Google Analytics 4 (cookies limitadas a 12 meses)
    window['ga-disable-' + GA4_ID] = false;
    if (!document.querySelector('script[src*="googletagmanager.com/gtag"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA4_ID, { cookie_expires: 31536000 });
    }
  }

  function clearAnalytics() {
    // Deja de medir en esta página y borra lo que se hubiera guardado.
    try { if (typeof window.clarity === 'function') window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }); } catch (e) {}
    window['ga-disable-' + GA4_ID] = true;
    try { localStorage.removeItem('pebai_attr_v1'); } catch (e) {}
    try { sessionStorage.removeItem('pebai_geo_origin'); } catch (e) {}

    var names = ANALYTICS_COOKIES.slice();
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n.indexOf('_ga_') === 0) names.push(n);
    });
    deleteCookies(names);
  }

  // Un mismo evento de una página (p. ej. la solicitud 42) se envía una sola vez aunque se recargue.
  function sentOnce(key) {
    try {
      var k = 'pebai_px_' + key;
      if (sessionStorage.getItem(k)) return true;
      sessionStorage.setItem(k, '1');
    } catch (e) {}
    return false;
  }

  function sendAd(item) {
    if (!item || !item[0] || typeof window.fbq !== 'function') return;
    var eventId = item[2] || '';
    if (eventId && sentOnce(eventId)) return;
    if (eventId) window.fbq('track', item[0], item[1] || {}, { eventID: eventId });
    else window.fbq('track', item[0], item[1] || {});
  }

  // Eventos del embudo según la página. El eventID coincide con el que manda el servidor
  // (api/lead.php y api/calcom-webhook.php) para que Meta no cuente dos veces.
  function pageEvents() {
    var path = window.location.pathname.replace(/\/+$/, '/');
    var q = new URLSearchParams(window.location.search);
    if (path === '/consultoria-gratuita/') {
      sendAd(['ViewContent', { content_name: 'VSL consultoría gratuita' }]);
    } else if (path === '/diagnostico/') {
      sendAd(['ViewContent', { content_name: 'Diagnóstico' }]);
    } else if (path === '/formulario-completado/') {
      var id = (q.get('solicitud') || '').replace(/\D+/g, '');
      if (id && id !== '0') sendAd(['Lead', { content_name: 'Diagnóstico enviado' }, 'lead-' + id]);
    } else if (path === '/confirmacion-de-llamada/') {
      var uid = (q.get('uid') || '').replace(/[^\w-]+/g, '');
      if (uid) sendAd(['Schedule', { content_name: 'Sesión reservada' }, 'cita-' + uid]);
    }
  }

  function loadAds() {
    if (adsLoaded || isPanel) return;
    adsLoaded = true;

    // Meta Pixel (snippet oficial)
    if (typeof window.fbq !== 'function') {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    }
    window.fbq('consent', 'grant');
    // Sin eventos automáticos (Meta adivinando clics): solo los que mandamos nosotros.
    window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
    pageEvents();

    var queue = window.pebaiAds || [];
    window.pebaiAds = { push: function (item) { sendAd(item); } };
    for (var i = 0; i < queue.length; i++) sendAd(queue[i]);
  }

  function clearAds() {
    try { if (typeof window.fbq === 'function') window.fbq('consent', 'revoke'); } catch (e) {}
    window.pebaiAds = { push: function () {} };
    deleteCookies(ADS_COOKIES);
  }

  function decide(analytics, ads) {
    var wasLoaded = loaded;
    var adsWereLoaded = adsLoaded;
    write(analytics, ads);
    hide();
    if (analytics) loadAnalytics();
    else if (wasLoaded) clearAnalytics();
    else { try { localStorage.removeItem('pebai_attr_v1'); } catch (e) {} }
    if (ads) loadAds();
    else if (adsWereLoaded) clearAds();
    else deleteCookies(ADS_COOKIES);
    try {
      document.dispatchEvent(new CustomEvent('pebai:consent', { detail: { analytics: !!analytics, ads: !!ads } }));
    } catch (e) {}
  }

  // Aviso compacto y no bloqueante: una tarjeta pequeña abajo que no tapa el vídeo ni los botones.
  var CSS = '' +
    '.pebai-cc{position:fixed;z-index:2147483000;left:20px;bottom:20px;width:420px;max-width:calc(100% - 40px);box-sizing:border-box;' +
    'padding:12px 12px 12px 16px;background:rgba(11,14,25,.94);color:#ECEBF0;border:1px solid rgba(255,255,255,.1);border-radius:14px;' +
    'box-shadow:0 12px 34px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);' +
    "font:400 13px/1.45 Manrope,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    'display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;text-align:left;animation:pebai-cc-in .35s cubic-bezier(.2,.8,.2,1)}' +
    '.pebai-cc[hidden]{display:none}' +
    '.pebai-cc *{box-sizing:border-box}' +
    '.pebai-cc p{margin:0;flex:1 1 200px;color:#A3A8BC;font-size:12.5px}' +
    '.pebai-cc a{color:#ECEBF0;text-decoration:underline;text-underline-offset:2px}' +
    '.pebai-cc-actions{display:flex;gap:6px;flex:0 0 auto}' +
    '.pebai-cc button{all:unset;box-sizing:border-box;cursor:pointer;min-height:34px;padding:7px 12px;' +
    'border-radius:9px;text-align:center;font:600 12.5px/1.2 Manrope,system-ui,-apple-system,sans-serif;' +
    'color:#ECEBF0;background:rgba(255,255,255,.08);border:1px solid rgba(236,235,240,.22);transition:background .15s ease}' +
    '.pebai-cc button:hover{background:rgba(255,255,255,.15)}' +
    '.pebai-cc button:focus-visible,.pebai-cc a:focus-visible,.pebai-cc input:focus-visible{outline:2px solid #B7FF3C;outline-offset:2px}' +
    '.pebai-cc-prefs{flex:1 1 100%;display:grid;gap:8px;padding:10px 0 2px;border-top:1px solid rgba(255,255,255,.1)}' +
    '.pebai-cc-prefs[hidden]{display:none}' +
    '.pebai-cc-prefs label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;color:#A3A8BC;font-size:12px}' +
    '.pebai-cc-prefs strong{color:#ECEBF0;font-weight:600}' +
    '.pebai-cc-prefs input{margin:2px 0 0;accent-color:#B7FF3C;width:16px;height:16px;flex:0 0 auto}' +
    '.pebai-cc-prefs .pebai-cc-actions{justify-content:flex-end}' +
    '@keyframes pebai-cc-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '@media (max-width:640px){.pebai-cc{left:10px;right:10px;bottom:10px;width:auto;max-width:none;padding:10px 10px 10px 14px;gap:10px}' +
    '.pebai-cc p{font-size:12px}}' +
    '@media (prefers-reduced-motion:reduce){.pebai-cc{animation:none}}' +
    '@media print{.pebai-cc{display:none!important}}';

  function build() {
    if (banner) return banner;
    var style = document.createElement('style');
    style.id = 'pebai-cc-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    banner = document.createElement('div');
    banner.className = 'pebai-cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.setAttribute('aria-describedby', 'pebai-cc-text');
    banner.hidden = true;
    banner.innerHTML =
      '<p id="pebai-cc-text">Usamos cookies de analítica y de publicidad (Meta) para mejorar la web y medir nuestros anuncios. <a href="' + POLICY_URL + '">Más info</a></p>' +
      '<div class="pebai-cc-actions">' +
      '<button type="button" data-cc="reject">Rechazar</button>' +
      '<button type="button" data-cc="prefs" aria-expanded="false" aria-controls="pebai-cc-prefs">Ajustes</button>' +
      '<button type="button" data-cc="accept">Aceptar</button>' +
      '</div>' +
      '<div class="pebai-cc-prefs" id="pebai-cc-prefs" hidden>' +
      '<label><input type="checkbox" data-cc-cat="analytics"><span><strong>Analítica</strong> · Microsoft Clarity y Google Analytics: cómo se usa la web.</span></label>' +
      '<label><input type="checkbox" data-cc-cat="ads"><span><strong>Publicidad</strong> · Píxel de Meta: medir nuestros anuncios en Facebook e Instagram.</span></label>' +
      '<div class="pebai-cc-actions"><button type="button" data-cc="save">Guardar</button></div>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-cc]') : null;
      if (!b) return;
      var action = b.getAttribute('data-cc');
      if (action === 'prefs') {
        var prefs = banner.querySelector('.pebai-cc-prefs');
        var c = read();
        banner.querySelector('[data-cc-cat="analytics"]').checked = !!(c && c.analytics);
        banner.querySelector('[data-cc-cat="ads"]').checked = !!(c && c.ads);
        prefs.hidden = !prefs.hidden;
        b.setAttribute('aria-expanded', prefs.hidden ? 'false' : 'true');
        if (!prefs.hidden) banner.querySelector('[data-cc-cat="analytics"]').focus();
        return;
      }
      if (action === 'save') {
        decide(banner.querySelector('[data-cc-cat="analytics"]').checked, banner.querySelector('[data-cc-cat="ads"]').checked);
        return;
      }
      var all = action === 'accept';
      decide(all, all);
    });
    banner.addEventListener('keydown', function (e) {
      // Escape solo cierra si ya había una elección completa guardada (reapertura).
      var c = read();
      if ((e.key === 'Escape' || e.key === 'Esc') && c && c.ads !== null) { e.preventDefault(); hide(); }
    });
    document.body.appendChild(banner);
    return banner;
  }

  function show(moveFocus) {
    if (isPanel) return;
    build();
    banner.hidden = false;
    if (moveFocus) {
      lastFocus = document.activeElement;
      var first = banner.querySelector('button');
      if (first) first.focus();
    }
  }

  function hide() {
    if (!banner || banner.hidden) return;
    var hadFocus = banner.contains(document.activeElement);
    banner.hidden = true;
    var prefs = banner.querySelector('.pebai-cc-prefs');
    if (prefs) prefs.hidden = true;
    if (hadFocus && lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) {
      try { lastFocus.focus(); } catch (e) {}
    }
    lastFocus = null;
  }

  window.PEBAI_CONSENT = {
    open: function () {
      if (document.body) show(true);
      else document.addEventListener('DOMContentLoaded', function () { show(true); });
    },
    analyticsAllowed: analyticsAllowed,
    adsAllowed: adsAllowed,
    // Identificadores del píxel para la API de Conversiones (solo con la publicidad aceptada).
    metaIds: function () {
      if (!adsAllowed()) return null;
      return { fbp: cookie('_fbp'), fbc: cookie('_fbc') };
    }
  };

  function init() {
    if (isPanel) return;
    var c = read();
    if (c) {
      if (c.analytics) loadAnalytics();
      if (c.ads) loadAds();
    }
    if (!c || c.ads === null) {
      // No se carga nada sin consentimiento, así que el aviso puede esperar unos segundos
      // y no interrumpe la primera impresión de la página.
      setTimeout(function () { var n = read(); if (!n || n.ads === null) show(false); }, SHOW_DELAY_MS);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
