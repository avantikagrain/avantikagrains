/**
 * Browser-side fetch for our own API.
 *
 * Exists so no call site has to remember the CSRF header. Every mutating
 * endpoint now rejects a request without it, and a forgotten header fails
 * at runtime with a 403 that reads like a session problem — the kind of
 * bug that gets "fixed" by turning the protection off.
 *
 * The token comes from a cookie our own middleware set, which is readable
 * here precisely because it is not HTTP-only; the session cookie is, and
 * never passes through JavaScript.
 */

const CSRF_COOKIE = 'ag_csrf';
const CSRF_HEADER = 'X-CSRF-Token';

function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  // document.cookie is one flat string; find our name among the pairs.
  for (const pair of document.cookie.split(';')) {
    const [name, ...rest] = pair.trim().split('=');
    if (name === CSRF_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/**
 * Same signature as `fetch`, with the CSRF header attached and JSON
 * defaults applied when a body is sent.
 */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = readCsrfToken();
  if (token) headers.set(CSRF_HEADER, token);

  return fetch(input, { ...init, headers });
}