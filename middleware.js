/* ============================================================
   VERCEL EDGE MIDDLEWARE — /branded password gate

   Runs before the static file is served. If the visitor does not
   carry a valid access cookie, they are sent to /branded-gate.

   The cookie never contains the password itself — it holds
   SHA-256(password), which this middleware recomputes from the
   BRANDED_PAGE_PASSWORD environment variable and compares.

   Fails CLOSED: if the env var is missing, the page is never served.
============================================================ */

export const config = {
  // Cover the clean route and the raw file, so /branded.html
  // cannot be used to walk around the gate.
  matcher: ['/branded', '/branded.html'],
};

const COOKIE_NAME = 'ba';

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time-ish comparison so the cookie can't be guessed byte by byte.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export default async function middleware(request) {
  const password = process.env.BRANDED_PAGE_PASSWORD;

  // No password configured → never expose the content.
  if (!password) {
    return new Response(
      'The branded section is not configured yet.',
      {
        status: 503,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-robots-tag': 'noindex, nofollow',
          'cache-control': 'no-store',
        },
      }
    );
  }

  const expected = await sha256Hex(password);
  const presented = readCookie(request, COOKIE_NAME);

  if (safeEqual(presented, expected)) {
    // Authorised — let the static page through untouched.
    return new Response(null, {
      headers: {
        'x-middleware-next': '1',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  }

  // Not authorised — send them to the access screen.
  const gate = new URL('/branded-gate', request.url);
  return new Response(null, {
    status: 302,
    headers: {
      location: gate.toString(),
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
