// Shared helpers for the public site and the admin area: translations and Sofia-time handling.

window.I18n = (function () {
  const STORAGE_KEY = 'lang';
  const listeners = [];
  let lang = 'bg';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    lang = saved === 'en' || saved === 'bg' ? saved : (window.SITE_CONFIG && SITE_CONFIG.defaultLanguage) || 'bg';
  } catch (e) {
    lang = (window.SITE_CONFIG && SITE_CONFIG.defaultLanguage) || 'bg';
  }

  function has(key) {
    return key in TRANSLATIONS[lang];
  }

  function t(key, vars) {
    let text = has(key) ? TRANSLATIONS[lang][key] : key;
    $.each(vars || {}, (name, value) => {
      text = text.split(`{${name}}`).join(value);
    });
    return text;
  }

  // Translates an API error response (or error code) into a user-facing message.
  function error(xhrOrCode) {
    const body = xhrOrCode && xhrOrCode.responseJSON;
    const code = body ? body.error : xhrOrCode;
    return has(`err.${code}`) ? t(`err.${code}`, body) : t('err.generic');
  }

  function apply() {
    document.documentElement.lang = lang;
    $('[data-i18n]').each(function () {
      $(this).text(t($(this).data('i18n')));
    });
    $('[data-i18n-placeholder]').each(function () {
      $(this).attr('placeholder', t($(this).data('i18n-placeholder')));
    });
    $('.lang-switch [data-lang]').each(function () {
      const active = $(this).data('lang') === lang;
      $(this).toggleClass('active', active).attr('aria-pressed', active);
    });
  }

  function set(newLang) {
    if (newLang === lang) return;
    lang = newLang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
    apply();
    listeners.forEach(fn => fn(lang));
  }

  $(document).on('click', '.lang-switch [data-lang]', function () {
    set($(this).data('lang'));
  });

  return {
    t,
    has,
    error,
    apply,
    onChange(fn) { listeners.push(fn); },
    get lang() { return lang; },
  };
})();

window.Time = (function () {
  const TZ = 'Europe/Sofia';

  function locale() {
    return I18n.lang === 'bg' ? 'bg-BG' : 'en-GB';
  }

  function sofiaParts(ms) {
    const parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ms)).forEach(p => { parts[p.type] = p.value; });
    parts.hour = String(Number(parts.hour) % 24).padStart(2, '0');
    return parts;
  }

  // How far Sofia's wall clock is ahead of UTC at the given instant.
  function offsetMs(ms) {
    const p = sofiaParts(ms);
    const wallAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return wallAsUtc - (ms - (ms % 1000));
  }

  // "2026-10-05T18:30" (Sofia wall-clock time) -> epoch ms.
  function fromSofiaInput(value) {
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
  function toSofiaInput(ms) {
    const p = sofiaParts(ms);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  function format(ms, options) {
    return new Intl.DateTimeFormat(locale(), $.extend({ timeZone: TZ }, options)).format(new Date(ms));
  }

  function time(ms) {
    return format(ms, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }

  function timeRange(start, end) {
    return `${time(start)} – ${time(end)}`;
  }

  function longDate(ms, withYear) {
    const opts = { weekday: 'long', day: 'numeric', month: 'long' };
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

window.icon = name => $('<i class="bi" aria-hidden="true"></i>').addClass(`bi-${name}`);
