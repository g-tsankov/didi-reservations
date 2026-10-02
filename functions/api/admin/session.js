import { json } from '../../../lib/http.js';

// The middleware has already verified the session by the time we get here.
export async function onRequestGet() {
  return json({ ok: true });
}
