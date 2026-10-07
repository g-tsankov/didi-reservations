<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { ApiError, apiFetch, errorText, type ApiOptions } from '@src/api';
import { SITE_CONFIG } from '@src/config';
import { useI18n } from '@src/useI18n';
import type { AdminEvent, EventDetails, TranslationKey } from '@src/types';
import EventModal from './EventModal.vue';
import LangSwitch from '../shared/LangSwitch.vue';
import ThemeSwitch from '../shared/ThemeSwitch.vue';

type Status = 'past' | 'inProgress' | 'upcoming';
type Filter = 'all' | 'upcoming' | 'past';

const STATUS_BADGE: Record<Status, [string, TranslationKey]> = {
  upcoming: ['text-bg-success', 'admin.statusUpcoming'],
  inProgress: ['text-bg-info', 'admin.statusInProgress'],
  past: ['text-bg-secondary', 'admin.statusPast'],
};
const FILTERS: [Filter, TranslationKey][] = [
  ['all', 'admin.filterAll'],
  ['upcoming', 'admin.filterUpcoming'],
  ['past', 'admin.filterPast'],
];

const { t, lang, time } = useI18n();
const cfg = SITE_CONFIG;

watchEffect(() => {
  document.title = `${t('admin.title')} · ${cfg.businessName}`;
});

const modal = useTemplateRef<InstanceType<typeof EventModal>>('modal');
const passwordInput = useTemplateRef<HTMLInputElement>('passwordInput');

// ---- API ----

/** apiFetch plus the global 401: any call except login and the start-up check sends you to the login form. */
async function api<T>(url: string, options?: ApiOptions): Promise<T> {
  try {
    return await apiFetch<T>(url, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && url !== '/api/admin/login' && url !== '/api/admin/session') {
      modal.value?.hide();
      showLogin(errorText(err));
    }
    throw err;
  }
}

// ---- Login / logout ----

const view = ref<'none' | 'login' | 'app'>('none');
const password = ref('');
const loginError = ref(''); // stored text, so a language change leaves it as shown
const loggingIn = ref(false);

function showLogin(message?: string): void {
  view.value = 'login';
  loginError.value = message || '';
  password.value = '';
  void nextTick(() => passwordInput.value?.focus());
}

function showApp(): void {
  view.value = 'app';
  void loadEvents();
}

async function login(): Promise<void> {
  loggingIn.value = true;
  try {
    await api<unknown>('/api/admin/login', { method: 'POST', json: { password: password.value } });
    showApp();
  } catch (err) {
    showLogin(errorText(err));
  } finally {
    loggingIn.value = false;
  }
}

async function logout(): Promise<void> {
  try {
    await api<unknown>('/api/admin/logout', { method: 'POST' });
  } catch { /* the login form is shown either way */ }
  showLogin();
}

// ---- Event list ----

const events = ref<AdminEvent[] | null>(null); // null = not loaded yet
const filter = ref<Filter>('all');
// Status is classified against this, refreshed only on list load, filter click and language change.
const now = ref(Date.now());

watch(lang, () => { now.value = Date.now(); });

function statusOf(ev: AdminEvent): Status {
  if (ev.endsAt <= now.value) return 'past';
  if (ev.startsAt <= now.value) return 'inProgress';
  return 'upcoming';
}

const rows = computed(() => (events.value ?? [])
  .map(ev => ({ ev, status: statusOf(ev) }))
  .filter(({ status }) => {
    if (filter.value === 'upcoming') return status !== 'past';
    if (filter.value === 'past') return status === 'past';
    return true;
  }));

function setFilter(value: Filter): void {
  filter.value = value;
  now.value = Date.now();
}

async function loadEvents(): Promise<void> {
  try {
    const data = await api<{ events: AdminEvent[] }>('/api/admin/events');
    events.value = data.events;
    now.value = Date.now();
  } catch { /* the global 401 handles an expired session; other failures leave the list as it was */ }
}

async function openEvent(id: number): Promise<void> {
  try {
    const data = await api<EventDetails>(`/api/admin/events/${id}`);
    modal.value?.open(data);
  } catch { /* non-401 errors are ignored, as before */ }
}

// ---- Start-up ----

(async () => {
  try {
    await api<unknown>('/api/admin/session');
    showApp();
  } catch (err) {
    showLogin(err instanceof ApiError && err.status === 401 ? '' : errorText(err));
  }
})();
</script>

<template>
  <nav class="navbar topbar">
    <div class="container gap-2">
      <span class="navbar-brand mb-0 h1 fs-5">
        <span class="business-name">{{ cfg.businessName }}</span> · <span>{{ t('admin.title') }}</span>
      </span>
      <div class="d-flex align-items-center gap-2">
        <a href="/" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener">
          <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
          <span class="d-none d-sm-inline">{{ t('admin.viewSite') }}</span>
        </a>
        <ThemeSwitch />
        <LangSwitch />
        <button type="button" class="btn btn-sm btn-outline-primary" :class="{ 'd-none': view !== 'app' }" id="logout" @click="logout">
          <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
          <span class="d-none d-sm-inline">{{ t('admin.logout') }}</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Login -->
  <section id="login-view" class="container" :class="{ 'd-none': view !== 'login' }">
    <div class="card admin-login shadow-sm">
      <div class="card-body p-4">
        <h1 class="h4 mb-3">{{ t('admin.loginTitle') }}</h1>
        <form id="login-form" @submit.prevent="login">
          <div class="mb-3">
            <label for="password" class="form-label">{{ t('admin.password') }}</label>
            <input ref="passwordInput" v-model="password" type="password" class="form-control" id="password" autocomplete="current-password" required>
          </div>
          <div class="alert alert-danger" :class="{ 'd-none': !loginError }" id="login-error" role="alert">{{ loginError }}</div>
          <button type="submit" class="btn btn-primary w-100" id="login-submit" :disabled="loggingIn">{{ t('admin.login') }}</button>
        </form>
      </div>
    </div>
  </section>

  <!-- Event list -->
  <main id="app-view" class="container py-4" :class="{ 'd-none': view !== 'app' }">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
      <h1 class="h3 mb-0">{{ t('admin.classes') }}</h1>
      <div class="d-flex flex-wrap gap-2">
        <div class="btn-group btn-group-sm" role="group" id="filter">
          <button
            v-for="[value, key] in FILTERS"
            :key="value"
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: filter === value }"
            :data-filter="value"
            @click="setFilter(value)"
          >{{ t(key) }}</button>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="new-event" @click="modal?.open(null)">
          <i class="bi bi-plus-lg" aria-hidden="true"></i> <span>{{ t('admin.newClass') }}</span>
        </button>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0 events-table">
          <thead>
            <tr>
              <th>{{ t('admin.colName') }}</th>
              <th>{{ t('admin.colDate') }}</th>
              <th class="text-center">{{ t('admin.colBooked') }}</th>
              <th>{{ t('admin.colStatus') }}</th>
            </tr>
          </thead>
          <tbody id="events-body">
            <tr
              v-for="{ ev, status } in rows"
              :key="ev.id"
              :data-id="ev.id"
              :class="{ 'is-past': status === 'past' }"
              @click="openEvent(ev.id)"
            >
              <td class="fw-semibold">{{ ev.name }}</td>
              <td>
                <div>{{ time.longDate(ev.startsAt, true) }}</div>
                <div class="small text-body-secondary">{{ time.timeRange(ev.startsAt, ev.endsAt) }}</div>
              </td>
              <td class="text-center">{{ ev.booked }} / {{ ev.capacity }}</td>
              <td><span class="badge" :class="STATUS_BADGE[status][0]">{{ t(STATUS_BADGE[status][1]) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="events-empty" class="text-center text-body-secondary py-5" :class="{ 'd-none': events === null || rows.length > 0 }">{{ t('admin.noClasses') }}</div>
    </div>
  </main>

  <EventModal ref="modal" :api="api" @changed="loadEvents" />
</template>
