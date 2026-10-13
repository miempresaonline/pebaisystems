/*
 * PEBAI · Atribución de tráfico
 * Guarda de dónde viene cada visitante (primer y último toque externo) y lo
 * propaga a los enlaces internos hacia el embudo para que llegue al formulario.
 * API: window.PEBAI_ATTR.get() -> { first, last, cta }
 */
(function () {
  'use strict';

  var STORE = 'pebai_attr_v1';
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
              'origen', 'palabra', 'gclid', 'fbclid', 'ttclid'];
  var PASS_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origen', 'palabra'];
  var FUNNEL_PATHS = ['/consultoria-gratuita', '/diagnostico'];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {}
  }

  function sourceFromReferrer(ref) {
    var host = '';
    try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { return 'desconocido'; }
    var map = [
      ['youtube', 'youtube'], ['youtu.be', 'youtube'], ['instagram', 'instagram'],
      ['facebook', 'facebook'], ['fb.', 'facebook'], ['tiktok', 'tiktok'], ['linkedin', 'linkedin'],
      ['lnkd.in', 'linkedin'], ['t.co', 'x'], ['twitter', 'x'], ['x.com', 'x'],
      ['chatgpt', 'chatgpt'], ['openai', 'chatgpt'], ['perplexity', 'perplexity'],
      ['gemini', 'gemini'], ['google', 'google'], ['bing', 'bing'], ['whatsapp', 'whatsapp']
    ];
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

  // Solo cuenta como "toque" una llegada desde fuera de la web (o directa).
  if (!internal) {
    if (!touch.utm_source) {
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
      if (!data.first) data.first = touch;
      data.last = touch;
      save(data);
    }
  }

  // Botón concreto que trajo al visitante al formulario (p. ej. cta=vsl_principal)
  var cta = params.get('cta');
  if (cta) {
    data.cta = cta.slice(0, 80);
    save(data);
  }

  function decorate() {
    var last = data.last || {};
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
      return { first: d.first || data.first || null, last: d.last || data.last || null, cta: d.cta || data.cta || '' };
    }
  };
})();
