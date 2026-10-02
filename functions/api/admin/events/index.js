import { json, fail, readJson } from '../../../../lib/http.js';
import { EVENT_SELECT, toEvent, loadEventDetails } from '../../../../lib/events.js';
import { validateEvent } from '../../../../lib/validate.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare(`${EVENT_SELECT} ORDER BY e.starts_at DESC`)
    .all();
  return json({ events: results.map(toEvent) });
}

export async function onRequestPost({ request, env }) {
  const { value, error } = validateEvent(await readJson(request));
  if (error) return fail(error);

  const now = Date.now();
  const res = await env.DB.prepare(
    `INSERT INTO events (name, description, starts_at, duration_minutes, ends_at, capacity, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`,
  ).bind(value.name, value.description, value.startsAt, value.durationMinutes, value.endsAt, value.capacity, now).run();

  return json(await loadEventDetails(env.DB, res.meta.last_row_id), 201);
}
