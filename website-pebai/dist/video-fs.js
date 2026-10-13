/*
 * PEBAI · Pantalla completa de los vídeos que funciona en todos los dispositivos.
 * - iPhone: Safari solo deja poner en pantalla completa el propio <video> (webkitEnterFullscreen).
 * - Android: pantalla completa del reproductor y giro a horizontal.
 * - Ordenador: pantalla completa del reproductor (como antes).
 * Uso desde cada página: if (window.PEBAI_FS && PEBAI_FS.toggle(chassis, video, unmuteTrigger)) return;
 */
(function () {
  'use strict';

  var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // Botones del reproductor cómodos para el dedo en móvil
  if (touch) {
    var st = document.createElement('style');
    st.textContent =
      '.player-bottombar button, .fullscreen-btn, .speed-btn, .vol-toggle-btn, .player-mini-btn {' +
      ' min-width: 44px !important; min-height: 44px !important; display: inline-flex; align-items: center; justify-content: center; }' +
      '.fullscreen-btn svg, .player-mini-btn svg { width: 20px !important; height: 20px !important; }';
    document.head.appendChild(st);
  }

  function isFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function exitFs() {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }

  // Si el vídeo está en vista previa muda, activa el sonido con la lógica de la propia página
  function ensurePlayingWithSound(video, unmuteTrigger) {
    if (!video) return;
    if ((video.muted || video.paused) && unmuteTrigger && unmuteTrigger.offsetParent !== null) {
      unmuteTrigger.click();
    } else if (video.paused) {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function toggle(chassis, video, unmuteTrigger) {
    if (isFs()) { exitFs(); return true; }

    // iPhone (y cualquier navegador sin pantalla completa de elementos)
    var elementFsSupported = !!(chassis && (chassis.requestFullscreen || chassis.webkitRequestFullscreen)) &&
      (document.fullscreenEnabled || document.webkitFullscreenEnabled);
    if (video && video.webkitEnterFullscreen && !elementFsSupported) {
      ensurePlayingWithSound(video, unmuteTrigger);
      try { video.webkitEnterFullscreen(); } catch (e) {}
      return true;
    }

    if (!chassis) return false;
    if (touch) ensurePlayingWithSound(video, unmuteTrigger);
    var req = chassis.requestFullscreen ? chassis.requestFullscreen({ navigationUI: 'hide' })
      : (chassis.webkitRequestFullscreen ? chassis.webkitRequestFullscreen() : null);
    // En móvil, girar a horizontal para que el vídeo ocupe la pantalla
    if (touch && req && req.then) {
      req.then(function () {
        try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
      }).catch(function () {
        // Si el reproductor no puede, se intenta con el vídeo directamente
        if (video && video.requestFullscreen) video.requestFullscreen().catch(function () {});
      });
    }
    return true;
  }

  document.addEventListener('fullscreenchange', function () {
    if (!isFs()) { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {} }
  });

  window.PEBAI_FS = { toggle: toggle };
})();
