/*
 * PEBAI · Atribución de tráfico
 * Detecta de dónde viene cada visitante y propaga los parámetros de origen a
 * los enlaces internos hacia el embudo para que lleguen al formulario.
 * Solo guarda el historial (primer y último toque externo) en
 * localStorage['pebai_attr_v1'] si el visitante ha aceptado la analítica
 * (ver /consent.js). Sin consentimiento trabaja solo con la URL actual.
 * API: window.PEBAI_ATTR.get() -> { first, last, cta }
 */
(function () {
  'use strict';

  var STORE = 'pebai_attr_v1';
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
              'origen', 'palabra', 'gclid', 'fbclid', 'ttclid'];
  // Los identificadores de clic de anuncios (gclid, fbclid, ttclid) también viajan hasta el formulario:
  // sin consentimiento es la única forma de saber que el lead vino de un anuncio.
  var PASS_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origen', 'palabra',
                   'gclid', 'fbclid', 'ttclid'];
  var FUNNEL_PATHS = ['/consultoria-gratuita', '/diagnostico'];

  // Consentimiento de analítica. consent.js puede no haberse cargado aún
  // (diagnostico carga este script en el <head>), así que se lee directamente.
  function consentGiven() {
    try {
      if (window.PEBAI_CONSENT && typeof window.PEBAI_CONSENT.analyticsAllowed === 'function') {
        return !!window.PEBAI_CONSENT.analyticsAllowed();
      }
      var c = JSON.parse(localStorage.getItem('pebai_consent'));
      if (!c || c.v !== 1 || c.analytics !== true) return false;
      var t = Date.parse(c.ts);
      return !!t && Date.now() - t <= 365 * 24 * 60 * 60 * 1000;
    } catch (e) { return false; }
  }

  function load() {
    if (!consentGiven()) return {};
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save(data) {
    if (!consentGiven()) return;
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {}
  }

  // Asistentes de IA primero: «chatgpt.com» contiene «t.co» y «gemini.google.com» contiene «google».
  // Misma lista que pebai_visita_origen() y pebai_canal_toque() en api/_pebai_lib.php.
  function sourceFromReferrer(ref) {
    var host = '';
    try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { return 'desconocido'; }
    var map = [
      ['chatgpt', 'chatgpt'], ['openai', 'chatgpt'], ['perplexity', 'perplexity'],
      ['gemini', 'gemini'], ['claude.ai', 'claude'], ['copilot', 'copilot'],
      ['youtube', 'youtube'], ['youtu.be', 'youtube'], ['instagram', 'instagram'],
      ['facebook', 'facebook'], ['fb.', 'facebook'], ['tiktok', 'tiktok'], ['linkedin', 'linkedin'],
      ['lnkd.in', 'linkedin'], ['twitter', 'x'],
      ['google', 'google'], ['bing', 'bing'], ['whatsapp', 'whatsapp']
    ];
    if (host === 't.co' || host === 'x.com') return 'x';
    for (var i = 0; i < map.length; i++) {
      if (host.indexOf(map[i][0]) !== -1) return map[i][1];
    }
    return host;
  }

  var params = new URLSearchParams(window.location.search);
  var referrer = document.referrer || '';
  var internal = false;
  try { internal = !!referrer && new URL(referrer).hostname === window.location.hostname; } catch (e) {}

  var touch = {};
  KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) touch[k] = v.slice(0, 200);
  });
  if (!touch.utm_source && touch.origen) touch.utm_source = touch.origen;
  if (!touch.utm_term && touch.palabra) touch.utm_term = touch.palabra;

  var data = load();
  var stored = !!(data.first || data.last);

  // Toque de esta visita: llegada desde fuera (o directa), o parámetros de
  // origen explícitos en la URL (p. ej. propagados desde otra página).
  var current = null;
  if (!internal && !touch.utm_source) {
    if (referrer) {
      touch.utm_source = sourceFromReferrer(referrer);
      touch.utm_medium = touch.utm_medium || 'referral';
    } else if (!data.first) {
      touch.utm_source = 'directo';
    }
  }
  if (touch.utm_source) {
    touch.landing = window.location.pathname;
    touch.referrer = referrer.slice(0, 300);
    touch.ts = new Date().toISOString();
    current = touch;
  }

  // Botón concreto que trajo al visitante al formulario (p. ej. cta=vsl_principal)
  var cta = params.get('cta');
  cta = cta ? cta.slice(0, 80) : '';

  // Guarda el toque de la visita actual (solo con consentimiento).
  function persist() {
    if (!consentGiven()) return;
    var d = load();
    // Solo cuenta como "toque" guardado una llegada desde fuera de la web (o directa).
    if (current && !internal) {
      if (!d.first) d.first = current;
      d.last = current;
    } else if (current && !d.first) {
      d.first = current;
      d.last = current;
    }
    if (cta) d.cta = cta;
    if (d.first || d.last || d.cta) save(d);
    data = d;
  }
  persist();

  document.addEventListener('pebai:consent', function (e) {
    if (e && e.detail && e.detail.analytics) persist();
    else data = {};
  });

  function decorate() {
    var last = (stored && data.last) || current || data.last || {};
    var extra = {};
    PASS_KEYS.forEach(function (k) { if (last[k]) extra[k] = last[k]; });
    if (!Object.keys(extra).length) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var url;
      try { url = new URL(a.getAttribute('href'), window.location.href); } catch (e) { continue; }
      if (url.hostname !== window.location.hostname) continue;
      var inFunnel = FUNNEL_PATHS.some(function (p) { return url.pathname.indexOf(p) === 0; });
      if (!inFunnel) continue;
      Object.keys(extra).forEach(function (k) {
        if (!url.searchParams.has(k)) url.searchParams.set(k, extra[k]);
      });
      a.setAttribute('href', url.pathname + url.search + url.hash);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorate);
  } else {
    decorate();
  }

  window.PEBAI_ATTR = {
    get: function () {
      var d = load();
      return {
        first: d.first || current || null,
        last: d.last || current || null,
        cta: d.cta || cta || ''
      };
    }
  };

  // Contador propio de visitas, sin cookies y para todos los visitantes (api/visita.php):
  // página, solo el dominio de procedencia y los utm de la URL. No guarda nada en el navegador
  // ni envía identificadores; el servidor suma 1 a un total diario (ver /politica-de-cookies/).
  try {
    var isPanel = /^\/panel(\/|$)/.test(window.location.pathname) || /^panel\./.test(window.location.hostname);
    if (!isPanel && !navigator.webdriver && navigator.sendBeacon) {
      var refHost = '';
      try { refHost = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
      var beacon = new URLSearchParams();
      beacon.set('p', window.location.pathname.slice(0, 120));
      beacon.set('r', refHost.slice(0, 80));
      beacon.set('s', (params.get('utm_source') || params.get('origen') || '').slice(0, 60));
      beacon.set('m', (params.get('utm_medium') || '').slice(0, 60));
      beacon.set('c', (params.get('utm_campaign') || '').slice(0, 80));
      navigator.sendBeacon('/api/visita.php', beacon);
    }
  } catch (e) {}

  // Respaldo de los recordatorios de citas: el servidor los revisa como mucho cada 10 min
  // (api/tick.php). No envía datos del visitante.
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/tick.php');
    else fetch('/api/tick.php', { method: 'POST', keepalive: true });
  } catch (e) {}
})();
