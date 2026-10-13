/*
 * PEBAI · Componentes compartidos del embudo (ver funnel.css)
 * Uso: <script src="/funnel.js" data-step="2" defer></script>
 * API: PEBAI_FUNNEL.go({ title, detail, note, href })
 */
(function () {
  'use strict';

  var STEPS = ['Solicitud', 'Revisión', 'Reserva', 'Sesión'];
  var KEY = 'pebai_handoff';
  var CHECK = '<svg viewBox="0 0 132 132" aria-hidden="true"><path d="M42 68 L59 85 L92 50"/></svg>';
  var me = document.currentScript;
  var step = parseInt((me && me.getAttribute('data-step')) || '0', 10);

  function stepper(current) {
    var ol = document.createElement('ol');
    ol.className = 'pf-steps';
    ol.setAttribute('aria-label', 'Progreso: paso ' + current + ' de ' + STEPS.length);
    STEPS.forEach(function (label, i) {
      var n = i + 1;
      var state = n < current ? 'done' : (n === current ? 'current' : 'next');
      var li = document.createElement('li');
      li.className = 'pf-step ' + state;
      if (state === 'current') li.setAttribute('aria-current', 'step');
      var dot = state === 'done'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : String(n);
      li.innerHTML = '<span class="pf-dot">' + dot + '</span><span class="pf-label">' + label + '</span>';
      ol.appendChild(li);
    });
    return ol;
  }

  function mountStepper() {
    if (!step) return;
    var main = document.querySelector('main');
    if (!main || main.querySelector('.pf-steps')) return;
    main.insertBefore(stepper(step), main.firstChild);
  }

  function mountHandoff() {
    if (!document.documentElement.classList.contains('handoff')) return;
    var el = document.createElement('div');
    el.className = 'pf-handoff';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="pf-handoff-badge">' + CHECK + '</div>';
    document.body.insertBefore(el, document.body.firstChild);
    setTimeout(function () { document.documentElement.classList.remove('handoff'); el.remove(); }, 2200);
  }

  function go(opts) {
    opts = opts || {};
    var t = document.createElement('div');
    t.className = 'pf-transition';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.innerHTML =
      '<div class="pf-t-bg"></div>' +
      '<div class="pf-badge"><span class="pf-ripple"></span><span class="pf-ripple r2"></span><span class="pf-ring"></span>' +
      CHECK.replace('<svg', '<svg class="pf-check"') + '</div>' +
      '<p class="pf-t-title"></p><div class="pf-t-detail"></div><div class="pf-t-bar"><span></span></div><div class="pf-t-note"></div>';
    t.querySelector('.pf-t-title').textContent = opts.title || '';
    t.querySelector('.pf-t-detail').textContent = opts.detail || '';
    t.querySelector('.pf-t-note').textContent = opts.note || '';
    document.body.appendChild(t);
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    // Fuerza el primer pintado antes de activar las animaciones
    t.getBoundingClientRect();
    document.body.classList.add('pf-leaving');
    t.classList.add('on');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () { window.location.href = opts.href; }, reduced ? 500 : 2450);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mountStepper(); mountHandoff(); });
  } else {
    mountStepper();
    mountHandoff();
  }

  window.PEBAI_FUNNEL = { go: go };
})();
