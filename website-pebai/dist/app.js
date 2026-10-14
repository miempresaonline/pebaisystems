(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  let manualReduced = false, themeBusy = false, lenis = null, ticker = null, scenes = null;
  try { manualReduced = localStorage.getItem('pebai-motion') === 'off'; } catch {}
  const motionOff = () => reduced.matches || manualReduced;
  const themeButtons = all('.theme-toggle');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButtons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(theme === 'light'));
      btn.setAttribute('aria-label', theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro');
    });
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = theme === 'light' ? '#EFEDE7' : '#12121A';
    try { localStorage.setItem('pebai-theme', theme); } catch {}
    dispatchEvent(new Event('pebai-theme'));
  }
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');

  themeButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (themeBusy) return;
      const current = root.dataset.theme || 'light';
      const next = current === 'light' ? 'dark' : 'light';

      const rect = btn.getBoundingClientRect();
      const x = e.clientX || (rect.left + rect.width / 2);
      const y = e.clientY || (rect.top + rect.height / 2);
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      if (!document.startViewTransition || motionOff()) {
        applyTheme(next);
        return;
      }

      themeBusy = true;
      const safetyTimer = setTimeout(() => { themeBusy = false; }, 700);

      try {
        const transition = document.startViewTransition(() => {
          applyTheme(next);
        });

        transition.ready.then(() => {
          if (document.documentElement.animate) {
            try {
              const anim = document.documentElement.animate(
                { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
                { duration: 600, easing: 'cubic-bezier(.22,.8,.22,1)', pseudoElement: '::view-transition-new(root)' }
              );
              anim.finished.finally(() => {
                clearTimeout(safetyTimer);
                themeBusy = false;
              });
            } catch {
              clearTimeout(safetyTimer);
              themeBusy = false;
            }
          } else {
            clearTimeout(safetyTimer);
            themeBusy = false;
          }
        }).catch(() => {
          applyTheme(next);
          clearTimeout(safetyTimer);
          themeBusy = false;
        });

        transition.finished.finally(() => {
          clearTimeout(safetyTimer);
          themeBusy = false;
        });
      } catch {
        applyTheme(next);
        clearTimeout(safetyTimer);
        themeBusy = false;
      }
    });
  });

  const menu = $('#mobile-menu'), menuButton = $('.menu-toggle');
  let menuBusy = false;

  function openMenu() {
    if (menuBusy || menu.open) return;
    menuBusy = true;
    menu.showModal();
    menuButton.setAttribute('aria-expanded', 'true');

    if (window.gsap && !motionOff()) {
      const links = menu.querySelectorAll('nav a');
      const closeBtn = menu.querySelector('.menu-close');
      const footer = menu.querySelector('.mobile-menu-footer');

      gsap.killTweensOf([menu, closeBtn, links, footer].filter(Boolean));

      gsap.fromTo(menu,
        { x: '100%', opacity: 0 },
        { x: '0%', opacity: 1, duration: 0.55, ease: 'power4.out' }
      );
      if (closeBtn) {
        gsap.fromTo(closeBtn,
          { rotate: -90, opacity: 0, scale: 0.8 },
          { rotate: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', delay: 0.08 }
        );
      }
      if (links.length) {
        gsap.fromTo(links,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.12 }
        );
      }
      if (footer) {
        gsap.fromTo(footer,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.42, onComplete: () => { menuBusy = false; } }
        );
      } else {
        menuBusy = false;
      }
    } else {
      menuBusy = false;
    }
  }

  function closeMenu(onDone) {
    if (menuBusy || !menu.open) { if (onDone) onDone(); return; }
    menuBusy = true;
    if (window.gsap && !motionOff()) {
      const links = menu.querySelectorAll('nav a');
      gsap.killTweensOf([menu, links]);
      gsap.to(links, {
        x: 20, opacity: 0, duration: 0.22, stagger: 0.02, ease: 'power2.in'
      });
      gsap.to(menu, {
        x: '100%', opacity: 0, duration: 0.35, ease: 'power3.in',
        onComplete: () => {
          menu.close();
          menuButton.setAttribute('aria-expanded', 'false');
          menuBusy = false;
          if (onDone) onDone();
        }
      });
    } else {
      menu.close();
      menuButton.setAttribute('aria-expanded', 'false');
      menuBusy = false;
      if (onDone) onDone();
    }
  }

  menuButton.addEventListener('click', openMenu);
  $('.menu-close')?.addEventListener('click', () => closeMenu());
  menu.addEventListener('close', () => menuButton.setAttribute('aria-expanded', 'false'));
  menu.addEventListener('click', (e) => {
    if (e.target === menu) {
      const r = menu.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right) closeMenu();
    }
  });

  function getTargetOffset(target) {
    const headerOffset = (window.innerWidth <= 760 ? 74 : 88) + 16;
    const rect = target.getBoundingClientRect();
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
    return Math.max(0, rect.top + currentScroll - headerOffset);
  }

  function smoothScrollTo(targetY, duration = 0.85, onComplete) {
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.15 });
      if (onComplete) setTimeout(onComplete, 1150);
      return;
    }

    if (window.gsap && !motionOff()) {
      const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollObj = { y: startY };
      
      gsap.killTweensOf(scrollObj);
      let userInterrupted = false;

      const stopTween = () => {
        userInterrupted = true;
      };

      // Allow 250ms grace period so touch-click doesn't kill scroll animation
      setTimeout(() => {
        window.addEventListener('wheel', stopTween, { passive: true, once: true });
        window.addEventListener('touchmove', stopTween, { passive: true, once: true });
      }, 250);

      gsap.to(scrollObj, {
        y: targetY,
        duration: duration,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (!userInterrupted) window.scrollTo(0, scrollObj.y);
        },
        onComplete: () => {
          if (!userInterrupted) window.scrollTo(0, targetY);
          window.ScrollTrigger?.update();
          if (onComplete) onComplete();
        }
      });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      if (onComplete) setTimeout(onComplete, 500);
    }
  }

  all('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.getElementById(id.slice(1));
    if (!target) return;
    event.preventDefault();

    const doScroll = () => {
      const targetY = getTargetOffset(target);
      if (lenis) {
        lenis.scrollTo(targetY, { duration: 1.15 });
      } else {
        smoothScrollTo(targetY, 0.95);
      }
      history.replaceState(null, '', id);
    };

    if (menu && menu.open) {
      link.style.color = 'var(--accent)';
      link.style.paddingLeft = '14px';
      closeMenu(() => {
        link.style.color = '';
        link.style.paddingLeft = '';
        requestAnimationFrame(() => {
          doScroll();
        });
      });
    } else {
      doScroll();
    }
  }));
  all('[data-social]').forEach((a) => {
    const key = a.dataset.social;
    let href = window.PEBAI_CONFIG?.links?.[key];
    const number = window.PEBAI_CONFIG?.whatsappNumber;
    if (number && (key === 'whatsapp' || key === 'whatsappConsultoria')) {
      const cleanNumber = String(number).replace(/\D/g, '');
      const textParam = key === 'whatsappConsultoria' ? `?text=${encodeURIComponent('Hola, soy [ x ] vengo de la web con principal interés en realizar una consultoría gratuita sin compromiso.')}` : '';
      href = `https://wa.me/${cleanNumber}${textParam}`;
    }
    if (href) a.href = href;

    if (key === 'instagram') {
      a.addEventListener('click', (e) => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          e.preventDefault();
          const targetUrl = href || 'https://www.instagram.com/pebaisystems/';
          const appUrl = 'instagram://user?username=pebaisystems';
          const start = Date.now();
          window.location.href = appUrl;
          setTimeout(() => {
            if (Date.now() - start < 2000 && !document.hidden) {
              window.open(targetUrl, '_blank');
            }
          }, 1200);
        }
      });
    }
  });

  // Preferencias de cookies: las gestiona /consent.js (banner y reapertura).
  all('.cookie-open').forEach((button) => button.addEventListener('click', () => {
    if (window.PEBAI_CONSENT) window.PEBAI_CONSENT.open();
  }));

  const hero = $('.hero'), pointer = $('.hero-mark-pointer');
  const floatingCta = $('.floating-cta');
  if (hero && floatingCta) {
    const syncFloatingCta = () => {
      floatingCta.classList.toggle('is-visible', scrollY > hero.offsetHeight * .62);
    };
    addEventListener('scroll', syncFloatingCta, {passive:true});
    addEventListener('resize', syncFloatingCta, {passive:true});
    syncFloatingCta();
  }
  let pointerFrame = 0, px = 0, py = 0;
  function renderPointer() {
    pointerFrame = 0;
    pointer.style.setProperty('--mx', px + 'px');
    pointer.style.setProperty('--my', py + 'px');
    pointer.style.setProperty('--rx', (-py * .22) + 'deg');
    pointer.style.setProperty('--ry', (px * .22) + 'deg');
  }
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || motionOff()) return;
    const rect = hero.getBoundingClientRect();
    px = Math.max(-16, Math.min(16, (e.clientX - rect.left - rect.width / 2) / rect.width * 32));
    py = Math.max(-12, Math.min(12, (e.clientY - rect.top - rect.height / 2) / rect.height * 24));
    if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { px = 0; py = 0; if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer); });

  function buildMotion(initial = false) {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (scenes) { scenes.revert(); scenes = null; }
    if (ticker && gsap) { gsap.ticker.remove(ticker); ticker = null; }
    if (lenis) { lenis.destroy(); lenis = null; }
    root.dataset.motion = motionOff() ? 'off' : 'on';
    px = py = 0; renderPointer();
    const control = $('.motion-toggle');
    control.setAttribute('aria-pressed', String(motionOff()));
    control.textContent = motionOff() ? 'Movimiento reducido' : 'Reducir movimiento';
    dispatchEvent(new Event('pebai-motion'));
    if (motionOff() || !gsap || !ST) return;
    gsap.registerPlugin(ST);
    if (window.Lenis && matchMedia('(pointer:fine)').matches) {
      lenis = new window.Lenis({duration:1.1,smoothWheel:true,syncTouch:false,anchors:false,prevent:node=>node.closest('dialog')});
      lenis.on('scroll', ST.update);
      ticker = time => lenis?.raf(time * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);
    }
    scenes = gsap.context(() => {
      const compactViewport = matchMedia('(max-width: 760px)').matches;
      if (initial && scrollY < 150 && !compactViewport) {
        if ($('.hero-v6-intro .eyebrow')) {
          gsap.from('.hero-v6-intro .eyebrow', { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out' });
        }
        if ($('.hero-v6 h1')) {
          gsap.from('.hero-v6 h1', { y: 22, opacity: 0, duration: 0.75, ease: 'power3.out', delay: 0.08 });
        }
        if ($('.hero-v6-lead, .hero-v6-actions, .hero-v6-assurance')) {
          gsap.from('.hero-v6-lead, .hero-v6-actions, .hero-v6-assurance', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.16 });
        }
        if ($('#hero-system-card')) {
          gsap.from('#hero-system-card', { y: 30, opacity: 0, scale: 0.97, duration: 0.85, ease: 'power3.out', delay: 0.22 });
        }
      }

      // Odometer / Counter animation for metrics ribbon
      const metricItems = all('.metrics-ribbon .metric-item strong');
      if (metricItems.length) {
        ST.create({
          trigger: '.metrics-ribbon',
          start: 'top 88%',
          once: true,
          onEnter: () => {
            metricItems.forEach(strong => {
              const text = strong.textContent.trim();
              if (text.includes('%')) {
                const obj = { val: 0 };
                gsap.to(obj, {
                  val: 100,
                  duration: 1.1,
                  ease: 'power2.out',
                  onUpdate: () => { strong.textContent = Math.round(obj.val) + '%'; }
                });
              } else if (text.includes('h')) {
                const obj = { val: 0 };
                gsap.to(obj, {
                  val: 24,
                  duration: 1.1,
                  ease: 'power2.out',
                  onUpdate: () => { strong.textContent = Math.round(obj.val) + 'h'; }
                });
              } else if (text.includes('0') && text.includes('€')) {
                gsap.fromTo(strong, { scale: 0.85, color: 'var(--lime)' }, { scale: 1, color: '', duration: 0.6, ease: 'back.out(2)' });
              }
            });
          }
        });
      }
      all('[data-reveal]').forEach(item => {
        if (item.getBoundingClientRect().bottom < 0) return;
        gsap.from(item,{y:28,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:item,start:'top 94%',once:true}});
      });
      all('.belief-art').forEach((art,i) => gsap.fromTo(art,{y:16,rotation:-5},{y:-10,rotation:5,ease:'none',scrollTrigger:{trigger:art.closest('.belief'),start:'top bottom',end:'bottom top',scrub:1}}));
      if ($('.geo-answer')) gsap.fromTo('.geo-answer',{y:12},{y:-8,ease:'none',scrollTrigger:{trigger:'.service-geo',start:'top bottom',end:'bottom top',scrub:1}});
    });
    ST.refresh();
  }
  $('.motion-toggle').addEventListener('click', () => {
    manualReduced = !manualReduced;
    try { localStorage.setItem('pebai-motion', manualReduced ? 'off' : 'on'); } catch {}
    buildMotion();
  });
  reduced.addEventListener('change', () => buildMotion());
  buildMotion(true);
  document.fonts.ready.then(() => window.ScrollTrigger?.refresh());
  addEventListener('load', () => window.ScrollTrigger?.refresh(), {once:true});
  const progress = $('.reading-progress span');
  let scrollFrame = 0;
  function updateProgress() {
    scrollFrame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const current = window.pageYOffset || document.documentElement.scrollTop || 0;
    const raw = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
    // Curva suave: más rápida al inicio y desacelerando progresivamente hacia el final
    const eased = 1 - Math.pow(1 - raw, 1.55);
    progress.style.width = (eased * 100) + '%';
  }
  addEventListener('scroll', () => { if(!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress); }, {passive:true});
  updateProgress();

  /* ==========================================================================
     PEBAI CRO, TELEMETRÍA SERVER-SIDE & ANALYTICS ZERO-TBT
     ========================================================================== */
  const analyticsCfg = window.PEBAI_CONFIG?.analytics || {};

  function pebaiTrackEvent(eventName, details = {}) {
    const payload = {
      event: eventName,
      source: window.location.href,
      device: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
      details: Object.assign({
        title: document.title,
        path: window.location.pathname
      }, details)
    };

    // 1. Google Analytics 4 (si está inicializado)
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, {
          event_category: 'conversion',
          event_label: details.label || document.title,
          value: eventName === 'generate_lead_whatsapp' ? (analyticsCfg.leadValueEUR || 50) : 1
        });
      } catch (err) {}
    }

    // 1.1 Microsoft Clarity Event Tracking
    if (typeof window.clarity === 'function') {
      try {
        window.clarity('event', eventName);
      } catch (err) {}
    }

    // 2. Telemetría Server-Side Privada (Salto de Ad-Blockers vía sendBeacon)
    const endpoint = analyticsCfg.telemetryEndpoint || '/api/telemetry.php';
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, blob);
    } else {
      try {
        fetch(endpoint, {
          method: 'POST',
          body: blob,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Escucha delegada de clicks de conversión
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button');
    if (!target) return;

    const explicitEvent = target.getAttribute('data-event');
    if (explicitEvent) {
      pebaiTrackEvent(explicitEvent, { href: target.href || '' });
      return;
    }

    if (target.href && target.href.includes('diagnostico')) {
      pebaiTrackEvent('click_diagnostico', { href: target.href });
    } else if (target.matches('.floating-cta, .floating-cta *')) {
      pebaiTrackEvent('whatsapp_lead_click', { href: target.href });
      pebaiTrackEvent('click_whatsapp_floating', { href: target.href });
    } else if (target.matches('.header-contact, .header-contact *')) {
      pebaiTrackEvent('whatsapp_lead_click', { href: target.href });
      pebaiTrackEvent('click_whatsapp_consultoria', { href: target.href });
    } else if (target.matches('.contact-orb, .contact-orb *')) {
      pebaiTrackEvent('generate_lead_whatsapp', { href: target.href, value: analyticsCfg.leadValueEUR || 50 });
    } else if (target.href && target.href.includes('wa.me')) {
      pebaiTrackEvent('whatsapp_lead_click', { href: target.href });
      pebaiTrackEvent('click_whatsapp_service', { href: target.href });
    }
  }, { passive: true });

  // Microsoft Clarity y GA4 los carga /consent.js, solo si el visitante acepta la analítica.

  window.pebaiTrackEvent = pebaiTrackEvent;
})();
