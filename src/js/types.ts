// Shared types for the Vue code and (via globals.d.ts) the legacy admin scripts.

export type TranslationKey =
  | 'pageTitle'
  | 'heroSubtitle'
  | 'heroTagline'
  | 'heroCta'
  | 'studioBlurb'
  | 'langSwitcherLabel'
  | 'fullLabel'
  | 'pastClass'
  | 'upcomingClasses'
  | 'noEvents'
  | 'loadError'
  | 'retry'
  | 'spotsLeft'
  | 'spotsLeftOne'
  | 'full'
  | 'inProgress'
  | 'bookNow'
  | 'contact'
  | 'reserveTitle'
  | 'duration'
  | 'yourName'
  | 'email'
  | 'phone'
  | 'confirmBooking'
  | 'close'
  | 'reservationSuccess'
  | 'err.invalid_name'
  | 'err.invalid_email'
  | 'err.invalid_phone'
  | 'err.full'
  | 'err.booking_closed'
  | 'err.already_booked'
  | 'err.not_found'
  | 'err.invalid_password'
  | 'err.unauthorized'
  | 'err.server_misconfigured'
  | 'err.invalid_description'
  | 'err.invalid_start'
  | 'err.invalid_duration'
  | 'err.invalid_capacity'
  | 'err.capacity_below_booked'
  | 'err.generic'
  | 'admin.title'
  | 'admin.loginTitle'
  | 'admin.password'
  | 'admin.login'
  | 'admin.logout'
  | 'admin.viewSite'
  | 'admin.classes'
  | 'admin.newClass'
  | 'admin.filterAll'
  | 'admin.filterUpcoming'
  | 'admin.filterPast'
  | 'admin.colName'
  | 'admin.colDate'
  | 'admin.colBooked'
  | 'admin.colStatus'
  | 'admin.statusUpcoming'
  | 'admin.statusInProgress'
  | 'admin.statusPast'
  | 'admin.noClasses'
  | 'admin.editClass'
  | 'admin.createClass'
  | 'admin.name'
  | 'admin.description'
  | 'admin.startDate'
  | 'admin.startTime'
  | 'admin.duration'
  | 'admin.capacity'
  | 'admin.save'
  | 'admin.saved'
  | 'admin.deleteClass'
  | 'admin.confirmDelete'
  | 'admin.confirmRemove'
  | 'admin.signups'
  | 'admin.noSignups'
  | 'admin.bookedAt'
  | 'admin.remove'
  | 'themeSwitcherLabel'
  | 'themeLight'
  | 'themeDark'
  | 'onboardingTip'
  | 'onboardingDismiss';

export type Lang = 'bg' | 'en';
export type ThemeValue = 'dark' | 'light';

export type Translations = Record<Lang, Record<TranslationKey, string>>;

export interface SiteConfig {
  businessName: string;
  address: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  defaultLanguage: string;
}

/** A class as returned by GET /api/events. Timestamps are epoch milliseconds. */
export interface ClassEvent {
  id: number;
  name: string;
  description: string;
  startsAt: number;
  endsAt: number;
  durationMinutes: number;
  spotsLeft: number;
  bookingOpen: boolean;
}

export interface TimeModule {
  fromSofiaInput(value: string | undefined | null): number | null;
  toSofiaInput(ms: number): string;
  format(ms: number, options?: Intl.DateTimeFormatOptions): string;
  time(ms: number): string;
  timeRange(start: number, end: number): string;
  longDate(ms: number, withYear?: boolean): string;
}

/** A class as returned by the admin API. Timestamps are epoch milliseconds. */
export interface AdminEvent {
  id: number;
  name: string;
  description: string;
  startsAt: number;
  endsAt: number;
  durationMinutes: number;
  booked: number;
  capacity: number;
}

export interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
}

/** GET/PUT /api/admin/events/:id and POST /api/admin/events. */
export interface EventDetails {
  event: AdminEvent;
  reservations: Reservation[];
}
