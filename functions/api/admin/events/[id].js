import { json, fail, readJson, parseId } from '../../../../lib/http.js';
import { loadEventDetails } from '../../../../lib/events.js';
import { validateEvent } from '../../../../lib/validate.js';

export async function onRequestGet({ env, params }) {
  const id = parseId(params.id);
  const details = id && (await loadEventDetails(env.DB, id));
  if (!details) return fail('not_found', 404);
  return json(details);
}

export async function onRequestPut({ request, env, params }) {
  const id = parseId(params.id);
  if (!id) return fail('not_found', 404);

  const { value, error } = validateEvent(await readJson(request));
  if (error) return fail(error);

  const existing = await loadEventDetails(env.DB, id);
  if (!existing) return fail('not_found', 404);
  if (value.capacity < existing.event.booked) {
    return fail('capacity_below_booked', 409, { n: existing.event.booked });
  }

  await env.DB.prepare(
    `UPDATE events
     SET name = ?2, description = ?3, starts_at = ?4, duration_minutes = ?5, ends_at = ?6, capacity = ?7, updated_at = ?8
     WHERE id = ?1`,
  ).bind(id, value.name, value.description, value.startsAt, value.durationMinutes, value.endsAt, value.capacity, Date.now()).run();

  return json(await loadEventDetails(env.DB, id));
}

export async function onRequestDelete({ env, params }) {
  const id = parseId(params.id);
  if (!id) return fail('not_found', 404);

  const [, res] = await env.DB.batch([
    env.DB.prepare('DELETE FROM reservations WHERE event_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM events WHERE id = ?1').bind(id),
  ]);
  if (res.meta.changes === 0) return fail('not_found', 404);
  return json({ ok: true });
}
