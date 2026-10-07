// fetch-based API helper for the Vue apps. Errors come back as `{ error: code }` and are
// translated through `err.<code>` keys in i18n.ts.

import { useI18n, type TranslationVars } from './useI18n';

/** Thrown for network failures (status 0), non-2xx responses and unparseable JSON bodies. */
export class ApiError extends Error {
  readonly status: number;
  /** The parsed JSON body, or null when there was none or it was not JSON. */
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Sent as a JSON body. */
  json?: unknown;
}

export async function apiFetch<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const init: RequestInit = { method: options.method ?? 'GET', headers: { Accept: 'application/json' } };
  if (options.json !== undefined) {
    init.headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.json);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(0, null);
  }

  let body: unknown = null;
  let parsed = true;
  try {
    body = await res.json();
  } catch {
    parsed = false;
  }

  if (!res.ok || !parsed) throw new ApiError(res.status, body);
  return body as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Turns an API error (or a bare error code) into a user-facing message: `err.<code>` with the
 * response body as interpolation vars, or `err.generic` for anything unknown.
 */
export function errorText(errOrCode: unknown): string {
  const { t, has } = useI18n();
  const body = errOrCode instanceof ApiError && isRecord(errOrCode.body) ? errOrCode.body : null;
  const code = body ? body.error : errOrCode;
  const key = typeof code === 'string' ? `err.${code}` : '';
  if (!key || !has(key)) return t('err.generic');

  const vars: TranslationVars = {};
  if (body) {
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string' || typeof v === 'number') vars[k] = v;
    }
  }
  return t(key, vars);
}
