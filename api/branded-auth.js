/* ============================================================
   POST /api/branded-auth

   Verifies the access code for the /branded section and, on a
   match, sets an HttpOnly cookie holding SHA-256(password).
   middleware.js recomputes that hash to authorise later requests.

   The password itself only ever exists in the environment
   variable — it is never sent back to the browser or stored
   in the cookie.
============================================================ */

const crypto = require('crypto');

const COOKIE_NAME = 'ba';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const sha256Hex = value =>
  crypto.createHash('sha256').update(value, 'utf8').digest('hex');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const password = process.env.BRANDED_PAGE_PASSWORD;
  if (!password) {
    return res.status(503).json({ ok: false, reason: 'unconfigured' });
  }

  // Body may arrive parsed or raw depending on content-type.
  let submitted = '';
  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    submitted = typeof body.password === 'string' ? body.password : '';
  } catch {
    submitted = '';
  }

  const expected = sha256Hex(password);
  const given = sha256Hex(submitted);

  // Equal-length hashes, so timingSafeEqual is safe to call directly.
  const match = crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(given, 'hex')
  );

  if (!match) {
    // Small delay to blunt automated guessing.
    await sleep(600);
    return res.status(401).json({ ok: false });
  }

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
  );

  return res.status(200).json({ ok: true });
};
