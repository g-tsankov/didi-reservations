// Onboarding tip visit counter, used by the public page's tip only.

export const DISMISSED_KEY = 'onboarding_dismissed';
const COUNT_KEY = 'onboarding_count';
const MAX_SHOWS = 3;

/**
 * Counts this page load as a showing. Returns true while the tip should still be shown: the first
 * three visits until "Got it" is clicked. Any storage failure means no tip.
 */
export function countOnboardingVisit(): boolean {
  try {
    if (localStorage.getItem(DISMISSED_KEY) === '1') return false;
    const count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
    if (count >= MAX_SHOWS) return false;
    localStorage.setItem(COUNT_KEY, String(count + 1));
    return true;
  } catch {
    return false;
  }
}
