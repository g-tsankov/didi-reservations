import { fail } from '../../../lib/http.js';
import { isAuthenticated, isConfigured } from '../../../lib/auth.js';

// Guards every /api/admin/* route except login.
export async function onRequest({ request, env, next }) {
  if (!isConfigured(env)) return fail('server_misconfigured', 500);

  const { pathname } = new URL(request.url);
  if (pathname === '/api/admin/login') return next();

  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401);
  return next();
}
