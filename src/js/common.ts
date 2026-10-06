// Shared helpers for the public site and the admin area: translations and Sofia-time handling.

window.I18n = (function (): I18nModule {
  const STORAGE_KEY = 'lang';
  const listeners: ((lang: string) => void)[] = [];
  let lang = 'bg';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    lang = saved === 'en' || saved === 'bg' ? saved : (window.SITE_CONFIG && SITE_CONFIG.defaultLanguage) || 'bg';
  } catch (e) {
    lang = (window.SITE_CONFIG && SITE_CONFIG.defaultLanguage) || 'bg';
  }

  function has(key: string): boolean {
    return key in TRANSLATIONS[lang];
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let text = has(key) ? TRANSLATIONS[lang][key] : key;
    if (vars) {
      $.each(vars, (k: string, v: string | number) => {
        text = text.split(`{${k}}`).join(String(v));
      });
    }
    return text;
  }

  // Translates an API error response (or error code) into a user-facing message.
  function error(xhrOrCode: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input = xhrOrCode as any;
    const body = input && input.responseJSON;
    const code: unknown = body ? body.error : xhrOrCode;
    return has(`err.${code}`) ? t(`err.${code}` as TranslationKey, body as Record<string, string | number>) : t('err.generic');
  }

  function apply(): void {
    document.documentElement.lang = lang;
    $('[data-i18n]').each(function (this: HTMLElement) {
      $(this).text(t($(this).data('i18n') as TranslationKey));
    });
    $('[data-i18n-placeholder]').each(function (this: HTMLElement) {
      $(this).attr('placeholder', t($(this).data('i18n-placeholder') as TranslationKey));
    });
    $('.lang-switch .dropdown-toggle').text(lang.toUpperCase());
    $('.lang-switch [data-lang]').each(function (this: HTMLElement) {
      $(this).toggleClass('active', $(this).data('lang') === lang);
    });
    $('.lang-switch').attr('aria-label', t('langSwitcherLabel'));
  }

  function set(newLang: string): void {
    if (newLang === lang) return;
    lang = newLang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
    apply();
    listeners.forEach(fn => fn(lang));
  }

  $(document).on('click', '.lang-switch [data-lang]', function (this: HTMLElement, e: JQuery.ClickEvent) {
    e.preventDefault();
    set($(this).data('lang') as string);
  });

  // Sync the dropdown toggle text immediately from the stored lang (scripts run after body so DOM exists).
  $('.lang-switch .dropdown-toggle').text(lang.toUpperCase());

  return {
    t,
    has,
    error,
    apply,
    onChange(fn: (lang: string) => void) { listeners.push(fn); },
    get lang() { return lang; },
  };
})();

window.Time = (function (): TimeModule {
  const TZ = 'Europe/Sofia';

  function locale(): string {
    return I18n.lang === 'bg' ? 'bg-BG' : 'en-GB';
  }

  function sofiaParts(ms: number): { year: string; month: string; day: string; hour: string; minute: string; second: string } {
    const parts: Record<string, string> = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ms)).forEach(p => { parts[p.type] = p.value; });
    parts.hour = String(Number(parts.hour) % 24).padStart(2, '0');
    return parts as { year: string; month: string; day: string; hour: string; minute: string; second: string };
  }

  // How far Sofia's wall clock is ahead of UTC at the given instant.
  function offsetMs(ms: number): number {
    const p = sofiaParts(ms);
    const wallAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return wallAsUtc - (ms - (ms % 1000));
  }

  // "2026-10-05T18:30" (Sofia wall-clock time) -> epoch ms.
  function fromSofiaInput(value: string | undefined | null): number | null {
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
  function toSofiaInput(ms: number): string {
    const p = sofiaParts(ms);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  function format(ms: number, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locale(), $.extend({ timeZone: TZ }, options) as Intl.DateTimeFormatOptions).format(new Date(ms));
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
})();

window.icon = (name: string): JQuery => $('<i class="bi" aria-hidden="true"></i>').addClass(`bi-${name}`);

window.Theme = (function (): ThemeModule {
  const STORAGE_KEY = 'theme';
  type ThemeValue = 'dark' | 'light';
  let current: ThemeValue = 'dark';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    current = saved === 'light' ? 'light' : 'dark';
  } catch (e) { /* storage unavailable */ }

  function apply(): void {
    if (current === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    const iconClass = current === 'light' ? 'bi-sun-fill' : 'bi-moon-stars-fill';
    $('.theme-switch .dropdown-toggle i').attr('class', `bi ${iconClass}`).attr('aria-hidden', 'true');
    $('.theme-switch [data-theme-btn]').each(function (this: HTMLElement) {
      $(this).toggleClass('active', $(this).data('theme-btn') === current);
    });
    $('.theme-switch').attr('aria-label', I18n.t('themeSwitcherLabel'));
  }

  function set(value: ThemeValue): void {
    if (value === current) return;
    current = value;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* storage unavailable */ }
    apply();
  }

  $(document).on('click', '.theme-switch [data-theme-btn]', function (this: HTMLElement, e: JQuery.ClickEvent) {
    e.preventDefault();
    set($(this).data('theme-btn') as ThemeValue);
  });

  apply();

  return {
    apply,
    get current() { return current; },
  };
})();

(function () {
  const DISMISSED_KEY = 'onboarding_dismissed';
  const COUNT_KEY = 'onboarding_count';
  const MAX_SHOWS = 3;

  try {
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    const count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
    if (count >= MAX_SHOWS) return;
    localStorage.setItem(COUNT_KEY, String(count + 1));
  } catch (e) {
    return;
  }

  $('#onboarding-tip').removeClass('d-none');

  $(document).on('click', '#onboarding-dismiss', function () {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) { /* storage unavailable */ }
    $('#onboarding-tip').addClass('d-none');
  });

  $(document).on('click', function (e: JQuery.ClickEvent) {
    if ($('#onboarding-tip').hasClass('d-none')) return;
    if (!($(e.target as HTMLElement).closest('#onboarding-tip').length)) {
      $('#onboarding-tip').addClass('d-none');
    }
  });
})();
