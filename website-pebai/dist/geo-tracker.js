/**
 * PEBAI SYSTEMS - GEO & AI Search Conversión Engine (v2.0)
 * Detecta y atribuye el tráfico proveniente de motores generativos (ChatGPT, Perplexity, Claude, Copilot, Gemini)
 * y envía eventos de conversión de alta resolución a Google Analytics 4.
 */
(function() {
  'use strict';

  var referrer = (document.referrer || '').toLowerCase();
  var currentUrl = window.location.href;
  var refHost = '';
  var refPath = '';
  try {
    var refUrl = new URL(referrer);
    refHost = refUrl.hostname.replace(/^www\./, '');
    refPath = refUrl.pathname;
  } catch(e) {}

  // Asistentes de IA (misma lista que utm.js y pebai_visita_origen() en api/_pebai_lib.php).
  // Se compara el dominio exacto, no un trozo de la URL.
  var AI_ENGINES = [
    { name: 'ChatGPT', test: function(h) { return h === 'chatgpt.com' || h === 'chat.openai.com'; } },
    { name: 'Perplexity', test: function(h) { return h === 'perplexity.ai'; } },
    { name: 'Claude', test: function(h) { return h === 'claude.ai'; } },
    { name: 'Microsoft Copilot', test: function(h, p) { return h === 'copilot.microsoft.com' || h === 'copilot.com' || (h === 'bing.com' && /^\/chat/.test(p)); } },
    { name: 'Google Gemini', test: function(h) { return h === 'gemini.google.com'; } }
  ];
  // Buscadores clásicos: solo para atribuir los clics de la sesión, no son visitas de IA.
  var SEARCH_ENGINES = [
    { name: 'Bing Search', test: function(h) { return h === 'bing.com'; } },
    { name: 'Google Organic', test: function(h) { return /^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(h); } }
  ];

  function detect(list) {
    for (var i = 0; i < list.length; i++) {
      if (refHost && list[i].test(refHost, refPath)) return list[i].name;
    }
    return null;
  }
  var aiSource = detect(AI_ENGINES);
  var detectedSource = aiSource || detect(SEARCH_ENGINES);

  // Persistir la fuente GEO en sessionStorage para atribuir toda la sesión
  // Solo con consentimiento de analítica (ver /consent.js).
  function analyticsAllowed() {
    try {
      if (window.PEBAI_CONSENT) return !!window.PEBAI_CONSENT.analyticsAllowed();
      var cc = JSON.parse(localStorage.getItem('pebai_consent'));
      return !!(cc && cc.v === 1 && cc.analytics === true && Date.now() - Date.parse(cc.ts) <= 31536000000);
    } catch(e) { return false; }
  }

  var activeGeoOrigin = null;
  function remember() {
    if (detectedSource) {
      try { sessionStorage.setItem('pebai_geo_origin', detectedSource); } catch(e) {}
    }
    try { activeGeoOrigin = sessionStorage.getItem('pebai_geo_origin'); } catch(e) {}
  }

  // Este script se carga antes que consent.js, que es quien crea gtag tras el consentimiento:
  // se espera a que gtag exista (como mucho ~5 s) antes de enviar el evento.
  function whenGtag(cb, tries) {
    if (typeof window.gtag === 'function') { cb(); return; }
    if ((tries || 0) >= 25) return;
    setTimeout(function() { whenGtag(cb, (tries || 0) + 1); }, 200);
  }

  var aiVisitSent = false;
  function sendAiVisit() {
    if (!aiSource || aiVisitSent) return;
    whenGtag(function() {
      if (aiVisitSent) return;
      aiVisitSent = true;
      window.gtag('event', 'geo_ai_visit', {
        'ai_platform': aiSource,
        'landing_path': window.location.pathname,
        'referrer_host': refHost,
        'transport_type': 'beacon'
      });
    });
  }

  // Con consentimiento previo se mide ya; si no, cuando el visitante acepte en el aviso.
  if (analyticsAllowed()) {
    remember();
    sendAiVisit();
  }
  document.addEventListener('pebai:consent', function(e) {
    if (e && e.detail && e.detail.analytics) {
      remember();
      sendAiVisit();
    } else {
      activeGeoOrigin = null;
    }
  });

  // Capturar clics de conversión (WhatsApp y Diagnóstico)
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;

    var href = (link.getAttribute('href') || '').toLowerCase();

    // 1. Clic hacia WhatsApp (Lead cualificado)
    if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion_whatsapp', {
          'event_category': 'Engagement B2B',
          'event_label': (link.innerText || 'WhatsApp CTA').trim().substring(0, 50),
          'page_location': currentUrl,
          'ai_attribution': activeGeoOrigin || 'Direct/Unknown',
          'value': 1,
          'transport_type': 'beacon'
        });
      }
    }

    // 2. Clic hacia Diagnóstico Técnico
    if (href.indexOf('/diagnostico') !== -1) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'lead_funnel_diagnostic', {
          'event_category': 'Funnel',
          'page_location': currentUrl,
          'ai_attribution': activeGeoOrigin || 'Direct/Unknown',
          'transport_type': 'beacon'
        });
      }
    }
  }, true);

})();
