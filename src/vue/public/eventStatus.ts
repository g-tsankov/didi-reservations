import type { ClassEvent } from '@src/types';

export type EventStatus = 'open' | 'full' | 'inProgress';

export function statusOf(ev: ClassEvent): EventStatus {
  if (!ev.bookingOpen) return 'inProgress';
  return ev.spotsLeft > 0 ? 'open' : 'full';
}
