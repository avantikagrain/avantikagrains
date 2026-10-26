const CSRF_COOKIE = 'ag_csrf';
const CSRF_HEADER = 'X-CSRF-Token';

function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  for (const pair of document.cookie.split(';')) {
    const [name, ...rest] = pair.trim().split('=');
    if (name === CSRF_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = readCsrfToken();
  if (token) headers.set(CSRF_HEADER, token);

  return fetch(input, { ...init, headers });
}
