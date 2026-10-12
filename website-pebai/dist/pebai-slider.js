// PEBAI Systems - Interactive Project Showcase Slider with Autoplay
(() => {
  const slider = document.querySelector('.project-slider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.slider-slide');
  const prevBtn = slider.querySelector('.slider-nav-prev');
  const nextBtn = slider.querySelector('.slider-nav-next');
  if (!slides.length) return;

  let current = 0;
  const total = slides.length;
  const INTERVAL_TIME = 6500; // 6.5 seconds: calm, premium pacing
  let autoplayTimer = null;
  let isPaused = false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                        document.documentElement.dataset.motion === 'off';

  function showSlide(index, restartAutoplay = true) {
    current = (index + total) % total;
    slides.forEach((slide, i) => {
      const isActive = i === current;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    if (restartAutoplay) {
      resetAutoplay();
    }
  }

  function nextSlide() {
    showSlide(current + 1, false);
  }

  function prevSlide() {
    showSlide(current - 1, false);
  }

  function startAutoplay() {
    if (reducedMotion || autoplayTimer) return;
    autoplayTimer = setInterval(() => {
      if (!isPaused) {
        nextSlide();
      }
    }, INTERVAL_TIME);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => showSlide(current - 1, true));
  if (nextBtn) nextBtn.addEventListener('click', () => showSlide(current + 1, true));

  // Pause on hover
  slider.addEventListener('mouseenter', () => { isPaused = true; });
  slider.addEventListener('mouseleave', () => { isPaused = false; });

  // Touch Swipe Support for Mobile
  let startX = 0, endX = 0;
  slider.addEventListener('touchstart', (e) => {
    isPaused = true;
    startX = e.touches[0].clientX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) showSlide(current + 1, true); // swipe left -> next
      else showSlide(current - 1, true); // swipe right -> prev
    }
    // Resume autoplay after brief delay
    setTimeout(() => { isPaused = false; }, 1500);
  }, { passive: true });

  showSlide(0, false);
  startAutoplay();
})();
