/// <reference types="jquery" />

type TranslationKey =
  | 'pageTitle'
  | 'heroSubtitle'
  | 'heroTagline'
  | 'heroCta'
  | 'studioBlurb'
  | 'langSwitcherLabel'
  | 'fullLabel'
  | 'pastClass'
  | 'upcomingClasses'
  | 'loading'
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
  | 'admin.remove';

interface SiteConfig {
  businessName: string;
  address: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  defaultLanguage: string;
}

interface I18nModule {
  t(key: TranslationKey, vars?: Record<string, string | number>): string;
  has(key: string): boolean;
  error(xhrOrCode: unknown): string;
  apply(): void;
  onChange(fn: (lang: string) => void): void;
  readonly lang: string;
}

interface TimeModule {
  fromSofiaInput(value: string | undefined | null): number | null;
  toSofiaInput(ms: number): string;
  format(ms: number, options?: Intl.DateTimeFormatOptions): string;
  time(ms: number): string;
  timeRange(start: number, end: number): string;
  longDate(ms: number, withYear?: boolean): string;
}

// Global Window augmentation.
interface Window {
  SITE_CONFIG: SiteConfig;
  TRANSLATIONS: Record<string, Record<TranslationKey, string>>;
  I18n: I18nModule;
  Time: TimeModule;
  icon: (name: string) => JQuery;
}

// Shorthand ambient declarations so consuming .ts files can omit `window.`.
declare const SITE_CONFIG: SiteConfig;
declare const TRANSLATIONS: Record<string, Record<TranslationKey, string>>;
declare const I18n: I18nModule;
declare const Time: TimeModule;
declare function icon(name: string): JQuery;
