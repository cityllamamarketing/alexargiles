/* ============================================================
   ACCESS GATE — submit, fail, or wipe through to /branded
============================================================ */
(function () {
  const form   = document.getElementById('gate-form');
  const inner  = form;                                  // .gate__inner is the form
  const field  = document.getElementById('gate-field');
  const input  = document.getElementById('gate-input');
  const status = document.getElementById('gate-status');
  const wipe   = document.getElementById('gate-wipe');

  if (!form || !input) return;

  let busy = false;

  // Focus once the entrance animation has mostly settled.
  setTimeout(() => input.focus(), 1400);

  function fail() {
    busy = false;
    inner.classList.remove('is-busy');

    // Restart the animations even on repeated failures.
    field.classList.remove('is-error');
    inner.classList.remove('is-error');
    void field.offsetWidth;
    field.classList.add('is-error');
    inner.classList.add('is-error');

    status.textContent = 'Access code not recognised.';

    input.value = '';
    input.focus();

    setTimeout(() => {
      field.classList.remove('is-error');
      inner.classList.remove('is-error');
    }, 700);
  }

  function succeed() {
    status.textContent = 'Access granted.';
    inner.classList.add('is-open');
    wipe.classList.add('is-active');

    // Hand off once the wipe has covered the screen.
    setTimeout(() => window.location.replace('/branded'), 1000);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;

    const password = input.value;
    if (!password) {
      fail();
      return;
    }

    busy = true;
    inner.classList.add('is-busy');

    try {
      const res = await fetch('/api/branded-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) succeed();
      else fail();
    } catch {
      fail();
    }
  });
})();
