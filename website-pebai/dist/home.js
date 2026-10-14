/*
 * PEBAI Systems · Web principal
 * Cabecera, menú móvil, aparición de secciones y eventos de conversión.
 * Sin dependencias: GSAP y Lenis solo los usan las landings antiguas.
 */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');

  // Cabecera con fondo al hacer scroll
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menú móvil
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('menu-open', open);
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) {
      if (m.matches) setMenu(false);
    });
  }

  // Aparición de bloques al entrar en pantalla
  var revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Botón "Configurar cookies" del pie (banner de /consent.js)
  document.querySelectorAll('.cookie-open').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.PEBAI_CONSENT && window.PEBAI_CONSENT.open) window.PEBAI_CONSENT.open();
    });
  });

  // Eventos de conversión: GA4 y Clarity (solo si hay consentimiento y están
  // cargados) y telemetría propia en api/telemetry.php.
  var cfg = (window.PEBAI_CONFIG && window.PEBAI_CONFIG.analytics) || {};
  function track(name, details) {
    details = details || {};
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, { event_category: 'conversion', event_label: document.title, value: 1 }); } catch (e) {}
    }
    if (typeof window.clarity === 'function') {
      try { window.clarity('event', name); } catch (e) {}
    }
    var payload = {
      event: name,
      source: window.location.href,
      device: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
      details: Object.assign({ title: document.title, path: window.location.pathname }, details)
    };
    var endpoint = cfg.telemetryEndpoint || '/api/telemetry.php';
    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, blob);
      else fetch(endpoint, { method: 'POST', body: blob, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  window.pebaiTrackEvent = track;

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-event], a[href*="wa.me"]');
    if (!a) return;
    var name = a.getAttribute('data-event');
    if (name) track(name, { href: a.href });
    if (/wa\.me/.test(a.href)) track('whatsapp_lead_click', { href: a.href });
  });
})();
