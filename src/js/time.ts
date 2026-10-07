// Sofia-time handling, shared by the Vue apps (via useI18n).
// All times are shown and entered in Europe/Sofia, whatever the visitor's timezone.

import type { TimeModule } from './types';

const TZ = 'Europe/Sofia';

interface SofiaParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

function sofiaParts(ms: number): SofiaParts {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ms)).forEach(p => { parts[p.type] = p.value; });
  parts.hour = String(Number(parts.hour) % 24).padStart(2, '0');
  return parts as unknown as SofiaParts;
}

// How far Sofia's wall clock is ahead of UTC at the given instant.
function offsetMs(ms: number): number {
  const p = sofiaParts(ms);
  const wallAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wallAsUtc - (ms - (ms % 1000));
}

// "2026-10-05T18:30" (Sofia wall-clock time) -> epoch ms.
export function fromSofiaInput(value: string | undefined | null): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let result = guess - offsetMs(guess);
  // Re-check in case the guess landed on the other side of a DST change.
  const corrected = guess - offsetMs(result);
  if (corrected !== result) result = corrected;
  return result;
}

// epoch ms -> "2026-10-05T18:30" for <input type="datetime-local">.
export function toSofiaInput(ms: number): string {
  const p = sofiaParts(ms);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/**
 * Builds the formatting helpers. `getLang` is called on every format, so passing a getter that
 * reads a Vue ref makes templates re-render when the language changes.
 */
export function createTime(getLang: () => string): TimeModule {
  function locale(): string {
    return getLang() === 'bg' ? 'bg-BG' : 'en-GB';
  }

  function format(ms: number, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locale(), { timeZone: TZ, ...options }).format(new Date(ms));
  }

  function time(ms: number): string {
    return format(ms, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }

  function timeRange(start: number, end: number): string {
    return `${time(start)} – ${time(end)}`;
  }

  function longDate(ms: number, withYear?: boolean): string {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    if (withYear) opts.year = 'numeric';
    return format(ms, opts);
  }

  return {
    fromSofiaInput,
    toSofiaInput,
    format,
    time,
    timeRange,
    longDate,
  };
}
