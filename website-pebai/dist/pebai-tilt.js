// PEBAI Systems - 3D Cursor Tilt for Hero Architecture Card
(() => {
  const card = document.getElementById('hero-system-card');
  const hero = document.getElementById('inicio');
  if (!card || !hero) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || 
                        document.documentElement.dataset.motion === 'off';
  if (reducedMotion) return;

  let targetRx = 0, targetRy = -7;
  let currentRx = 0, currentRy = -7;
  let rafId = null;

  function update() {
    currentRx += (targetRx - currentRx) * 0.12;
    currentRy += (targetRy - currentRy) * 0.12;

    card.style.setProperty('--card-rx', `${currentRx.toFixed(2)}deg`);
    card.style.setProperty('--card-ry', `${currentRy.toFixed(2)}deg`);

    if (Math.abs(targetRx - currentRx) > 0.02 || Math.abs(targetRy - currentRy) > 0.02) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (e.clientX - cx) / (window.innerWidth / 2);
    const dy = (e.clientY - cy) / (window.innerHeight / 2);

    targetRy = Math.max(-16, Math.min(16, dx * 18));
    targetRx = Math.max(-14, Math.min(14, -dy * 15));

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${localX.toFixed(1)}px`);
    card.style.setProperty('--mouse-y', `${localY.toFixed(1)}px`);

    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    targetRx = 0;
    targetRy = -7; // Rest angle
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });
})();
