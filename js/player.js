/* ============================================================
   FULLSCREEN VIDEO PLAYER
============================================================ */

const player    = document.getElementById('player');
const video     = document.getElementById('player-video');
const playBtn   = document.getElementById('player-play-btn');
const scrubber  = document.getElementById('player-scrubber');
const timeEl    = document.getElementById('player-time');
const muteBtn   = document.getElementById('player-mute-btn');
const soundLabel = document.getElementById('player-sound-label');
const fsBtn     = document.getElementById('player-fs-btn');
const closeBtn  = document.getElementById('player-close');

if (!video) { console.warn('No video element found'); }

/* ── Helpers ──────────────────────────────────────────── */
const fmt = s => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

/* ── Play / Pause ─────────────────────────────────────── */
let isPlaying = false;

const setPlaying = playing => {
  isPlaying = playing;
  player.classList.toggle('is-paused', !playing);

  // Centre play button: show when paused
  playBtn.classList.toggle('hidden', playing);

  // Toggle play/pause icon in controls
  document.getElementById('ctrl-play-icon').style.display  = playing ? 'none'  : 'block';
  document.getElementById('ctrl-pause-icon').style.display = playing ? 'block' : 'none';
};

const togglePlay = () => {
  if (video.paused) { video.play(); } else { video.pause(); }
};

video.addEventListener('play',  () => setPlaying(true));
video.addEventListener('pause', () => setPlaying(false));
video.addEventListener('ended', () => setPlaying(false));

// Click video or centre button to toggle
video.addEventListener('click', togglePlay);
playBtn.addEventListener('click', togglePlay);

// Spacebar
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    togglePlay();
  }
  if (e.code === 'Escape') goBack();
});

/* ── Controls play/pause button ──────────────────────── */
document.getElementById('player-ctrl-play').addEventListener('click', togglePlay);

/* ── Scrubber ─────────────────────────────────────────── */
video.addEventListener('timeupdate', () => {
  if (!video.duration) return;
  const pct = (video.currentTime / video.duration) * 100;
  scrubber.value = pct;

  // Tint filled portion
  scrubber.style.background =
    `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;

  timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
});

scrubber.addEventListener('input', () => {
  if (!video.duration) return;
  video.currentTime = (scrubber.value / 100) * video.duration;
});

video.addEventListener('loadedmetadata', () => {
  timeEl.textContent = `0:00 / ${fmt(video.duration)}`;
});

/* ── Mute / Sound ─────────────────────────────────────── */
const setMuted = muted => {
  video.muted = muted;
  soundLabel.textContent = muted ? 'Sound Off' : 'Sound On';
  document.getElementById('mute-icon').style.display   = muted ? 'none'  : 'block';
  document.getElementById('unmute-icon').style.display = muted ? 'block' : 'none';
};

muteBtn.addEventListener('click', () => setMuted(!video.muted));
setMuted(false); // start with sound on

/* ── Fullscreen ───────────────────────────────────────── */
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    player.requestFullscreen?.() || player.webkitRequestFullscreen?.();
  } else {
    document.exitFullscreen?.() || document.webkitExitFullscreen?.();
  }
});

/* ── Idle / auto-hide controls ───────────────────────── */
let idleTimer;
const resetIdle = () => {
  player.classList.remove('is-idle');
  clearTimeout(idleTimer);
  if (isPlaying) {
    idleTimer = setTimeout(() => player.classList.add('is-idle'), 3000);
  }
};

document.addEventListener('mousemove', resetIdle);
document.addEventListener('keydown',   resetIdle);
video.addEventListener('play', resetIdle);

/* ── Custom cursor on player page ────────────────────── */
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

if (cursorDot && cursorRing && window.matchMedia('(hover: hover)').matches) {
  let mouseX = -200, mouseY = -200;
  let ringX  = -200, ringY  = -200;
  let visible = false;

  const lerp = (a, b, t) => a + (b - a) * t;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
    if (!visible) {
      ringX = mouseX; ringY = mouseY;
      cursorDot.classList.add('is-visible');
      cursorRing.classList.add('is-visible');
      visible = true;
    }
  }, { passive: true });

  (function tick() {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    cursorRing.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    requestAnimationFrame(tick);
  })();

  document.addEventListener('mouseover', e => {
    const over = !!e.target.closest('a, button');
    cursorDot.classList.toggle('is-hover', over);
    cursorRing.classList.toggle('is-hover', over);
  });

  document.addEventListener('mousedown', () => {
    cursorDot.classList.add('is-click');
    cursorRing.classList.add('is-click');
  });
  document.addEventListener('mouseup', () => {
    cursorDot.classList.remove('is-click');
    cursorRing.classList.remove('is-click');
  });
}

/* ── Close / back ─────────────────────────────────────── */
const goBack = () => {
  video.pause();
  if (history.length > 1) { history.back(); }
  else { window.location.href = '../index.html#work'; }
};

closeBtn.addEventListener('click', e => { e.preventDefault(); goBack(); });

/* ── Autoplay on load ─────────────────────────────────── */
video.play().catch(() => {
  // Autoplay blocked — show paused state
  setPlaying(false);
});

/* ── Footer year ──────────────────────────────────────── */
const fyEl = document.getElementById('footer-year');
if (fyEl) fyEl.textContent = new Date().getFullYear();
