/* ============================================================
   PAGE LOADER
============================================================ */
(function () {
  const loader  = document.getElementById('page-loader');
  const bar     = document.getElementById('loader-bar');
  if (!loader || !bar) return;

  // Minimum display time so the loader never flashes too briefly
  const MIN_MS = 1400;
  const start  = Date.now();

  // Animate the bar from 0 → ~85% while page loads, then snap to 100% on done
  let progress = 0;
  let rafId;

  function advanceBar() {
    // Ease toward 85% autonomously — slows as it approaches
    progress += (85 - progress) * 0.04;
    setBar(progress);
    rafId = requestAnimationFrame(advanceBar);
  }

  function setBar(pct) {
    bar.style.right = (100 - pct) + '%';
  }

  function dismiss() {
    cancelAnimationFrame(rafId);
    setBar(100);
    // Wait a beat for the bar to visually complete, then fade loader out
    setTimeout(() => loader.classList.add('is-hidden'), 350);
  }

  advanceBar();

  window.addEventListener('load', () => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, MIN_MS - elapsed);
    setTimeout(dismiss, remaining);
  });
})();

/* ============================================================
   FOOTER YEAR
============================================================ */
document.getElementById('footer-year').textContent = new Date().getFullYear();

/* ============================================================
   CUSTOM CURSOR — dot + lagging ring, magnetic to panel titles
============================================================ */
const cursorDot   = document.getElementById('cursor-dot');
const cursorRing  = document.getElementById('cursor-ring');
const cursorLabel = document.getElementById('cursor-label');

if (cursorDot && cursorRing && window.matchMedia('(hover: hover)').matches) {
  let mouseX = -200, mouseY = -200;
  let dotX   = -200, dotY   = -200;
  let ringX  = -200, ringY  = -200;
  let visible      = false;
  let magnetTarget = null; // { x, y } when attached to a title

  const lerp = (a, b, t) => a + (b - a) * t;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Attach to panel title if mouse is directly over one in an active panel
    const titleEl = e.target.closest('.project-panel__title');
    if (titleEl && titleEl.closest('.project-panel')?.classList.contains('is-active')) {
      const r = titleEl.getBoundingClientRect();
      magnetTarget = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } else {
      magnetTarget = null;
    }

    if (!visible) {
      dotX = mouseX; dotY = mouseY;
      ringX = mouseX; ringY = mouseY;
      cursorDot.classList.add('is-visible');
      cursorRing.classList.add('is-visible');
      visible = true;
    }
  }, { passive: true });

  // Single RAF loop — dot, ring, and label all update together
  (function tick() {
    const tx = magnetTarget ? magnetTarget.x : mouseX;
    const ty = magnetTarget ? magnetTarget.y : mouseY;

    // Dot: instant when free, smooth pull when magnetic
    dotX = lerp(dotX, tx, magnetTarget ? 0.14 : 1);
    dotY = lerp(dotY, ty, magnetTarget ? 0.14 : 1);
    cursorDot.style.transform = `translate(calc(${dotX}px - 50%), calc(${dotY}px - 50%))`;

    // Ring: always lerps
    ringX = lerp(ringX, tx, 0.12);
    ringY = lerp(ringY, ty, 0.12);
    cursorRing.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;

    // Label: tracks dot position, offset to the right of the ring
    if (cursorLabel) {
      cursorLabel.style.transform = `translate(calc(${dotX}px + 38px), calc(${dotY}px - 7px))`;
    }

    requestAnimationFrame(tick);
  })();

  // Hover state — show contextual label for panels and tagged links
  document.addEventListener('mouseover', e => {
    const onPanel    = !!e.target.closest('.project-panel');
    const onLink     = !!e.target.closest('a, button');
    const labelEl    = e.target.closest('[data-cursor-label]');
    const over       = onPanel || onLink;
    const showLabel  = (onPanel && !onLink) || !!labelEl;

    cursorDot.classList.toggle('is-hover', over);
    cursorRing.classList.toggle('is-hover', over);

    if (cursorLabel) {
      if (showLabel) {
        cursorLabel.textContent = labelEl ? labelEl.dataset.cursorLabel : 'VIEW';
      }
      cursorLabel.classList.toggle('is-visible', showLabel);
    }
  });

  // Click
  document.addEventListener('mousedown', () => {
    cursorDot.classList.add('is-click');
    cursorRing.classList.add('is-click');
  });
  document.addEventListener('mouseup', () => {
    cursorDot.classList.remove('is-click');
    cursorRing.classList.remove('is-click');
  });

  // Hide when pointer leaves viewport
  document.addEventListener('mouseleave', () => {
    cursorDot.classList.remove('is-visible');
    cursorRing.classList.remove('is-visible');
    if (cursorLabel) cursorLabel.classList.remove('is-visible');
    visible = false;
  });
  document.addEventListener('mouseenter', () => {
    cursorDot.classList.add('is-visible');
    cursorRing.classList.add('is-visible');
    visible = true;
  });
}

/* ============================================================
   HEADER scroll state
============================================================ */
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ============================================================
   HAMBURGER — fullscreen overlay nav (index only)
============================================================ */
const navToggle  = document.getElementById('nav-toggle');
const navOverlay = document.getElementById('nav-overlay');

if (navToggle && navOverlay) {
  const openNav = () => {
    navOverlay.classList.add('is-open');
    navOverlay.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeNav = () => {
    navOverlay.classList.remove('is-open');
    navOverlay.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  navToggle.addEventListener('click', () => {
    navOverlay.classList.contains('is-open') ? closeNav() : openNav();
  });

  navOverlay.querySelectorAll('.nav-overlay__link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNav();
  });
}

/* ============================================================
   HERO VIDEO — fade in on load
============================================================ */
const heroVideo = document.querySelector('.hero__video');
if (heroVideo) {
  const mark = () => heroVideo.classList.add('loaded');
  heroVideo.readyState >= 3 ? mark() : heroVideo.addEventListener('canplay', mark, { once: true });
}

/* ============================================================
   PROJECT PANELS — click to navigate to player page
============================================================ */
const panelLinks = {
  'panel-clave':   'work/clave.html',
  'panel-utv':     'work/utv.html',
  'panel-brother': 'work/the-brother.html',
  'panel-hann':    'work/hann.html',
  'panel-exit':    'work/exit.html',
  'panel-emmy':    'emmys.html',
};

Object.entries(panelLinks).forEach(([id, href]) => {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.cursor = 'pointer';
  panel.addEventListener('click', () => window.location.href = href);
});

/* ============================================================
   PROJECT PANELS — activate on scroll into view
   - Plays background video
   - Animates text content in
   - Subtle image zoom
============================================================ */
const panels = document.querySelectorAll('.project-panel');

const panelObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const panel = entry.target;
    const video = panel.querySelector('.project-panel__video:not(.project-panel__video--primary)');
    const primaryVideo = panel.querySelector('.project-panel__video--primary');

    if (entry.isIntersecting) {
      panel.classList.add('is-active');
      if (video) video.play().catch(() => {});
      if (primaryVideo) primaryVideo.play().catch(() => {});
    } else {
      panel.classList.remove('is-active');
      if (video) { video.pause(); video.currentTime = 0; }
      // Keep primary videos playing (they're the only background)
    }
  });
}, {
  threshold: 0.45,  // panel must be nearly half in view to activate
});

panels.forEach(p => panelObserver.observe(p));

/* ============================================================
   SCROLL REVEAL — about / contact sections
============================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

