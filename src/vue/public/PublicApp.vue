<script setup lang="ts">
import { ref, useTemplateRef, watchEffect } from 'vue';
import { apiFetch } from '@src/api';
import { SITE_CONFIG } from '@src/config';
import { useI18n } from '@src/useI18n';
import type { ClassEvent } from '@src/types';
import LangSwitch from '../shared/LangSwitch.vue';
import ThemeSwitch from '../shared/ThemeSwitch.vue';
import OnboardingTip from '../shared/OnboardingTip.vue';
import EventCard from './EventCard.vue';
import ReserveModal from './ReserveModal.vue';

const { t } = useI18n();
const cfg = SITE_CONFIG;
const telHref = `tel:${cfg.contact.phone.replace(/[^+\d]/g, '')}`;

watchEffect(() => {
  document.title = `${cfg.businessName} · ${t('pageTitle')}`;
});

const events = ref<ClassEvent[] | null>(null); // null = not loaded yet
const loadFailed = ref(false);
const current = ref<ClassEvent | null>(null); // event shown in the popup
const modal = useTemplateRef<InstanceType<typeof ReserveModal>>('modal');

/** Fetches the list. A failure only shows the error state when nothing has loaded yet. Resolves to success. */
async function loadEvents(): Promise<boolean> {
  loadFailed.value = false;
  try {
    const data = await apiFetch<{ events: ClassEvent[] }>('/api/events');
    events.value = data.events;
    return true;
  } catch {
    loadFailed.value = events.value === null;
    return false;
  }
}

function retry(): void {
  events.value = null;
  loadFailed.value = false;
  void loadEvents();
}

function openReservation(id: number): void {
  if (!events.value) return;
  current.value = events.value.find(ev => ev.id === id) ?? null;
  if (!current.value) return;
  modal.value?.open(current.value);
}

async function onReserved(id: number): Promise<void> {
  if (!(await loadEvents())) return;
  const fresh = events.value?.find(ev => ev.id === id);
  if (fresh && current.value) current.value = fresh;
}

function onRejected(): void {
  void loadEvents();
}

void loadEvents();
</script>

<template>
  <nav class="site-nav">
    <div class="container">
      <span class="nav-brand business-name">{{ cfg.businessName }}</span>
      <span class="nav-address" id="nav-address">{{ cfg.address }}</span>
      <div class="d-flex gap-2 align-items-center">
        <ThemeSwitch />
        <OnboardingTip />
        <LangSwitch />
      </div>
    </div>
  </nav>

  <header class="hero text-center">
    <div class="container">
      <h1 class="display-5 fw-bold business-name mb-2">{{ cfg.businessName }}</h1>
      <p class="lead mb-3 hero-tagline">{{ t('heroTagline') }}</p>
      <a href="#events" class="btn btn-primary">{{ t('heroCta') }}</a>
    </div>
  </header>

  <section id="studio-blurb">
    <div class="container">
      <p>{{ t('studioBlurb') }}</p>
    </div>
  </section>

  <main class="container py-5">
    <h2 class="h3 mb-4">{{ t('upcomingClasses') }}</h2>
    <div
      id="events-state"
      class="text-center py-5 text-body-secondary"
      :class="{ 'd-none': !loadFailed && (events === null || events.length > 0) }"
    >
      <template v-if="loadFailed">
        <p>{{ t('loadError') }}</p>
        <button type="button" class="btn btn-outline-primary btn-sm" id="retry" @click="retry">{{ t('retry') }}</button>
      </template>
      <template v-else-if="events !== null && events.length === 0">
        <i class="bi bi-calendar-x fs-1 d-block mb-2" aria-hidden="true"></i>
        <p>{{ t('noEvents') }}</p>
      </template>
    </div>
    <div id="events" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <template v-if="!loadFailed && events === null">
        <div v-for="i in 3" :key="i" class="col"><div class="skeleton-card"></div></div>
      </template>
      <template v-else-if="!loadFailed && events">
        <EventCard v-for="ev in events" :key="ev.id" :event="ev" @open="openReservation" />
      </template>
    </div>
  </main>

  <footer class="contact-section py-5">
    <div class="container">
      <h2 class="h4 mb-3">{{ t('contact') }}</h2>
      <ul class="list-unstyled mb-0 contact-list">
        <li><i class="bi bi-person-fill" aria-hidden="true"></i><span id="contact-name">{{ cfg.contact.name }}</span></li>
        <li><i class="bi bi-envelope-fill" aria-hidden="true"></i><a id="contact-email" :href="`mailto:${cfg.contact.email}`">{{ cfg.contact.email }}</a></li>
        <li><i class="bi bi-telephone-fill" aria-hidden="true"></i><a id="contact-phone" :href="telHref">{{ cfg.contact.phone }}</a></li>
      </ul>
    </div>
  </footer>

  <!-- Reservation popup -->
  <ReserveModal ref="modal" :event="current" @reserved="onReserved" @rejected="onRejected" />
</template>
