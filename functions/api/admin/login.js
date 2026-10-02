import { json, fail, readJson } from '../../../lib/http.js';
import { checkPassword, createSessionCookie } from '../../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const password = body && typeof body.password === 'string' ? body.password : '';

  if (!(await checkPassword(env, password))) {
    // Small delay to slow down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fail('invalid_password', 401);
  }

  return json({ ok: true }, 200, { 'Set-Cookie': await createSessionCookie(env) });
}
