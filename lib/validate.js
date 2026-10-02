const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()\-]{6,20}$/;

function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateReservation(body) {
  if (!body) return { error: 'invalid_body' };

  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const phone = str(body.phone);

  if (!name || name.length > 100) return { error: 'invalid_name' };
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: 'invalid_email' };
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 6) return { error: 'invalid_phone' };

  return { value: { name, email, phone } };
}

export function validateEvent(body) {
  if (!body) return { error: 'invalid_body' };

  const name = str(body.name);
  const description = str(body.description);
  const startsAt = Number(body.startsAt);
  const durationMinutes = Number(body.durationMinutes);
  const capacity = Number(body.capacity);

  if (!name || name.length > 120) return { error: 'invalid_name' };
  if (description.length > 2000) return { error: 'invalid_description' };
  if (!Number.isInteger(startsAt) || startsAt <= 0) return { error: 'invalid_start' };
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
    return { error: 'invalid_duration' };
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) return { error: 'invalid_capacity' };

  return {
    value: {
      name,
      description,
      startsAt,
      durationMinutes,
      endsAt: startsAt + durationMinutes * 60 * 1000,
      capacity,
    },
  };
}
