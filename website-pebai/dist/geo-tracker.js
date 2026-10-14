/**
 * PEBAI SYSTEMS - GEO & AI Search Conversión Engine (v2.0)
 * Detecta y atribuye el tráfico proveniente de motores generativos (ChatGPT, Perplexity, Claude, Copilot, Gemini)
 * y envía eventos de conversión de alta resolución a Google Analytics 4.
 */
(function() {
  'use strict';

  var referrer = (document.referrer || '').toLowerCase();
  var currentUrl = window.location.href;

  var AI_ENGINES = [
    { name: 'ChatGPT', pattern: /chatgpt\.com|oaistatic\.com|openai\.chatgpt/ },
    { name: 'Perplexity', pattern: /perplexity\.ai/ },
    { name: 'Claude', pattern: /claude\.ai|anthropic/ },
    { name: 'Microsoft Copilot', pattern: /copilot\.microsoft\.com|bing\.com\/chat/ },
    { name: 'Google Gemini', pattern: /gemini\.google\.com/ },
    { name: 'Bing Search', pattern: /bing\.com(?!.*\/chat)/ },
    { name: 'Google Organic', pattern: /google\.[a-z]{2,3}(?!.*\/ads)/ }
  ];

  var detectedSource = null;
  for (var i = 0; i < AI_ENGINES.length; i++) {
    if (AI_ENGINES[i].pattern.test(referrer)) {
      detectedSource = AI_ENGINES[i].name;
      break;
    }
  }

  // Persistir la fuente GEO en sessionStorage para atribuir toda la sesión
  // Solo con consentimiento de analítica (ver /consent.js).
  var analyticsOk = false;
  try {
    if (window.PEBAI_CONSENT) {
      analyticsOk = !!window.PEBAI_CONSENT.analyticsAllowed();
    } else {
      var cc = JSON.parse(localStorage.getItem('pebai_consent'));
      analyticsOk = !!(cc && cc.v === 1 && cc.analytics === true && Date.now() - Date.parse(cc.ts) <= 31536000000);
    }
  } catch(e) {}
  if (detectedSource && analyticsOk) {
    try {
      sessionStorage.setItem('pebai_geo_origin', detectedSource);
    } catch(e) {}
  }

  var activeGeoOrigin = null;
  try {
    activeGeoOrigin = sessionStorage.getItem('pebai_geo_origin');
  } catch(e) {}

  // Si es una visita proveniente de IA generativa, registrar evento en GA4
  if (detectedSource && typeof gtag === 'function') {
    gtag('event', 'geo_ai_visit', {
      'ai_platform': detectedSource,
      'landing_path': window.location.pathname,
      'referrer_url': referrer,
      'transport_type': 'beacon'
    });
  }

  // Capturar clics de conversión (WhatsApp y Diagnóstico)
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;

    var href = (link.getAttribute('href') || '').toLowerCase();

    // 1. Clic hacia WhatsApp (Lead cualificado)
    if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
      if (typeof gtag === 'function') {
        gtag('event', 'conversion_whatsapp', {
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
      if (typeof gtag === 'function') {
        gtag('event', 'lead_funnel_diagnostic', {
          'event_category': 'Funnel',
          'page_location': currentUrl,
          'ai_attribution': activeGeoOrigin || 'Direct/Unknown',
          'transport_type': 'beacon'
        });
      }
    }
  }, true);

})();
