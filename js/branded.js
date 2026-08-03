/* ============================================================
   BRANDED PAGE — entry wipe, scroll reveal, video behaviour
============================================================ */

/* ---------- Entry wipe (continues the gate's transition) ---------- */
(function () {
  const wipe = document.getElementById('page-wipe');
  if (!wipe) return;
  requestAnimationFrame(() => wipe.classList.add('is-clear'));
  setTimeout(() => wipe.remove(), 1200);
})();

/* ---------- Footer year ---------- */
(function () {
  const year = document.getElementById('footer-year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* ---------- Scroll reveal ---------- */
(function () {
  const items = document.querySelectorAll('.vid');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
})();

/* ---------- Video behaviour ----------
   Hover  → silent preview
   Click  → play with sound + native controls
------------------------------------------------- */
(function () {
  const frames = document.querySelectorAll('.vid__frame');
  if (!frames.length) return;

  const canHover = window.matchMedia('(hover: hover)').matches;

  // A paused <video> paints nothing until a frame has been decoded, which
  // would leave every card as an empty rectangle. Seeking slightly into the
  // clip forces one frame to render, so each video posters itself.
  const POSTER_TIME = 0.12;

  frames.forEach(frame => {
    const video = frame.querySelector('.vid__media');
    if (!video) return;

    let opened = false; // true once the visitor has clicked to watch properly

    const prime = () => {
      if (video.currentTime < POSTER_TIME) {
        try { video.currentTime = POSTER_TIME; } catch { /* ignore */ }
      }
    };
    if (video.readyState >= 1) prime();
    else video.addEventListener('loadedmetadata', prime, { once: true });

    if (canHover) {
      frame.addEventListener('mouseenter', () => {
        if (opened) return;
        video.play().catch(() => {});
      });

      frame.addEventListener('mouseleave', () => {
        if (opened) return;
        video.pause();
        video.currentTime = POSTER_TIME; // back to the still, not to blank
      });
    }

    frame.addEventListener('click', () => {
      if (opened) return;
      opened = true;

      video.muted = false;
      video.loop = false;
      video.controls = true;
      video.currentTime = 0;
      frame.classList.add('is-playing');
      video.play().catch(() => {});
    });
  });
})();
