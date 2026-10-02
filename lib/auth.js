// Stateless admin sessions: the cookie holds "<expiry>.<HMAC(expiry)>".
// Rotating SESSION_SECRET invalidates every existing session.

const COOKIE_NAME = 'admin_session';
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isConfigured(env) {
  return Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET);
}

export async function checkPassword(env, candidate) {
  // Compare fixed-length digests so the check doesn't leak the password length.
  const [given, expected] = await Promise.all([
    hmac(env.SESSION_SECRET, 'password:' + candidate),
    hmac(env.SESSION_SECRET, 'password:' + env.ADMIN_PASSWORD),
  ]);
  return safeEqual(given, expected);
}

export async function createSessionCookie(env) {
  const expires = Date.now() + SESSION_SECONDS * 1000;
  const token = `${expires}.${await hmac(env.SESSION_SECRET, 'session:' + expires)}`;
  return `${COOKIE_NAME}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAuthenticated(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expiresStr, sig] = match[1].split('.');
  const expires = Number(expiresStr);
  if (!sig || !Number.isFinite(expires) || expires < Date.now()) return false;

  return safeEqual(sig, await hmac(env.SESSION_SECRET, 'session:' + expires));
}
