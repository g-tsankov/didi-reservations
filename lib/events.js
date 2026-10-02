const BOOKED_SQL = '(SELECT COUNT(*) FROM reservations r WHERE r.event_id = e.id)';

export const EVENT_SELECT = `SELECT e.*, ${BOOKED_SQL} AS booked FROM events e`;

export function toEvent(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    capacity: row.capacity,
    booked: row.booked,
  };
}

export function toReservation(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

// Full admin view of one event: details plus everyone who signed up.
export async function loadEventDetails(db, id) {
  const [eventRes, reservationsRes] = await db.batch([
    db.prepare(`${EVENT_SELECT} WHERE e.id = ?1`).bind(id),
    db.prepare('SELECT * FROM reservations WHERE event_id = ?1 ORDER BY created_at ASC').bind(id),
  ]);
  const row = eventRes.results[0];
  if (!row) return null;
  return {
    event: toEvent(row),
    reservations: reservationsRes.results.map(toReservation),
  };
}
