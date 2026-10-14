/*
 * PEBAI · Consentimiento de cookies
 * Muestra el aviso de cookies y solo carga la analítica (Microsoft Clarity y
 * Google Analytics 4) si el visitante la acepta. Sin dependencias.
 *
 * Elección guardada en localStorage['pebai_consent'] = {v:1, analytics:bool, ts:ISO}
 * (caduca a los 12 meses).
 * API: window.PEBAI_CONSENT.open(), .analyticsAllowed()
 * Evento: document 'pebai:consent' con detail {analytics:bool}
 */
(function () {
  'use strict';

  if (window.PEBAI_CONSENT) return;

  var KEY = 'pebai_consent';
  var VERSION = 1;
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  var CLARITY_ID = 'yjwe6ir50h';
  var GA4_ID = 'G-2QFM6HCTWV';
  var POLICY_URL = '/politica-de-cookies/';
  var ANALYTICS_COOKIES = ['_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM', '_ga', '_gid', '_gat'];

  var isPanel = /^\/panel(\/|$)/.test(window.location.pathname);
  var loaded = false;
  var banner = null;
  var lastFocus = null;

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (!c || c.v !== VERSION || typeof c.analytics !== 'boolean') return null;
      var t = Date.parse(c.ts);
      if (!t || Date.now() - t > MAX_AGE_MS) return null;
      return c;
    } catch (e) { return null; }
  }

  function write(analytics) {
    var c = { v: VERSION, analytics: !!analytics, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  function analyticsAllowed() {
    var c = read();
    return !!(c && c.analytics);
  }

  function loadAnalytics() {
    if (loaded || isPanel) return;
    loaded = true;

    // Microsoft Clarity (snippet oficial)
    if (!document.querySelector('script[src*="clarity.ms/tag"]')) {
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", CLARITY_ID);
    }
    try { window.clarity('consent'); } catch (e) {}

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
    try { if (typeof window.clarity === 'function') window.clarity('consent', false); } catch (e) {}
    window['ga-disable-' + GA4_ID] = true;
    try { localStorage.removeItem('pebai_attr_v1'); } catch (e) {}
    try { sessionStorage.removeItem('pebai_geo_origin'); } catch (e) {}

    var host = window.location.hostname;
    var parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    var names = ANALYTICS_COOKIES.slice();
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n.indexOf('_ga_') === 0) names.push(n);
    });
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function decide(analytics) {
    var wasLoaded = loaded;
    write(analytics);
    hide();
    if (analytics) loadAnalytics();
    else if (wasLoaded) clearAnalytics();
    else { try { localStorage.removeItem('pebai_attr_v1'); } catch (e) {} }
    try {
      document.dispatchEvent(new CustomEvent('pebai:consent', { detail: { analytics: !!analytics } }));
    } catch (e) {}
  }

  var CSS = '' +
    '.pebai-cc{position:fixed;z-index:2147483000;left:50%;bottom:20px;transform:translateX(-50%);' +
    'width:calc(100% - 40px);max-width:620px;box-sizing:border-box;padding:18px 20px;' +
    'background:rgba(11,14,25,.96);color:#ECEBF0;border:1px solid rgba(106,92,255,.38);border-radius:16px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.03) inset;' +
    '-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);' +
    "font:400 14px/1.55 Manrope,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    'display:flex;align-items:center;gap:18px;text-align:left;animation:pebai-cc-in .35s cubic-bezier(.2,.8,.2,1)}' +
    '.pebai-cc[hidden]{display:none}' +
    '.pebai-cc *{box-sizing:border-box}' +
    '.pebai-cc p{margin:0;flex:1 1 auto;color:#A3A8BC;font-size:13.5px}' +
    '.pebai-cc p strong{color:#ECEBF0;font-weight:600}' +
    '.pebai-cc a{color:#B7FF3C;text-decoration:underline;text-underline-offset:2px}' +
    '.pebai-cc a:hover{color:#d4ff8a}' +
    '.pebai-cc-actions{display:flex;gap:10px;flex:0 0 auto}' +
    '.pebai-cc button{all:unset;box-sizing:border-box;cursor:pointer;min-width:104px;min-height:40px;padding:9px 18px;' +
    'border-radius:10px;text-align:center;font:600 14px/1.2 Manrope,system-ui,-apple-system,sans-serif;' +
    'color:#ECEBF0;background:rgba(255,255,255,.07);border:1px solid rgba(236,235,240,.28);' +
    'transition:background .15s ease,border-color .15s ease}' +
    '.pebai-cc button:hover{background:rgba(255,255,255,.13);border-color:rgba(236,235,240,.5)}' +
    '.pebai-cc button:focus-visible,.pebai-cc a:focus-visible{outline:2px solid #B7FF3C;outline-offset:2px}' +
    '@keyframes pebai-cc-in{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}' +
    '@media (max-width:640px){.pebai-cc{left:12px;right:12px;bottom:12px;width:auto;max-width:none;transform:none;' +
    'flex-direction:column;align-items:stretch;gap:12px;padding:14px 14px 12px;max-height:35vh;max-height:35dvh;overflow-y:auto;' +
    'animation-name:pebai-cc-in-m}' +
    '.pebai-cc p{font-size:13px}.pebai-cc-actions{width:100%}.pebai-cc button{flex:1 1 0;min-height:44px;min-width:0}}' +
    '@keyframes pebai-cc-in-m{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
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
      '<p id="pebai-cc-text">Usamos cookies de analítica (Microsoft Clarity y Google Analytics) para entender cómo se usa la web y mejorarla. ' +
      'Puedes aceptarlas o rechazarlas. <a href="' + POLICY_URL + '">Política de cookies</a></p>' +
      '<div class="pebai-cc-actions">' +
      '<button type="button" data-cc="reject">Rechazar</button>' +
      '<button type="button" data-cc="accept">Aceptar</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-cc]') : null;
      if (!b) return;
      decide(b.getAttribute('data-cc') === 'accept');
    });
    banner.addEventListener('keydown', function (e) {
      // Escape solo cierra si ya había una elección guardada (reapertura).
      if ((e.key === 'Escape' || e.key === 'Esc') && read()) { e.preventDefault(); hide(); }
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
    analyticsAllowed: analyticsAllowed
  };

  function init() {
    if (isPanel) return;
    var c = read();
    if (c) {
      if (c.analytics) loadAnalytics();
    } else {
      show(false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
