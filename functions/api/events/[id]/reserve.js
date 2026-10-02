import { json, fail, readJson, parseId } from '../../../../lib/http.js';
import { validateReservation } from '../../../../lib/validate.js';

export async function onRequestPost({ request, env, params }) {
  const id = parseId(params.id);
  if (!id) return fail('not_found', 404);

  const { value, error } = validateReservation(await readJson(request));
  if (error) return fail(error);

  const now = Date.now();

  // Single statement so the capacity check and insert are atomic.
  try {
    const res = await env.DB.prepare(
      `INSERT INTO reservations (event_id, name, email, phone, created_at)
       SELECT e.id, ?2, ?3, ?4, ?5 FROM events e
       WHERE e.id = ?1
         AND e.starts_at > ?5
         AND (SELECT COUNT(*) FROM reservations r WHERE r.event_id = e.id) < e.capacity`,
    ).bind(id, value.name, value.email, value.phone, now).run();

    if (res.meta.changes === 1) return json({ ok: true }, 201);
  } catch (err) {
    if (String(err && err.message).includes('UNIQUE')) return fail('already_booked', 409);
    throw err;
  }

  // Nothing was inserted: work out why.
  const event = await env.DB.prepare('SELECT starts_at FROM events WHERE id = ?1').bind(id).first();
  if (!event) return fail('not_found', 404);
  if (event.starts_at <= now) return fail('booking_closed', 409);
  return fail('full', 409);
}
