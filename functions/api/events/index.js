import { json } from '../../../lib/http.js';
import { EVENT_SELECT } from '../../../lib/events.js';

// Public list: everything that hasn't ended yet. Booking closes at start time,
// but a class stays visible (as "in progress") until it ends.
export async function onRequestGet({ env }) {
  const now = Date.now();
  const { results } = await env.DB
    .prepare(`${EVENT_SELECT} WHERE e.ends_at > ?1 ORDER BY e.starts_at ASC`)
    .bind(now)
    .all();

  const events = results.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    spotsLeft: Math.max(0, row.capacity - row.booked),
    bookingOpen: row.starts_at > now,
  }));

  return json({ events });
}
