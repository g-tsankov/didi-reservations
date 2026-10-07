<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { BModal } from 'bootstrap-vue-next/components/BModal';
import { apiFetch, errorText } from '@src/api';
import { useI18n } from '@src/useI18n';
import type { ClassEvent } from '@src/types';
import StatusBadge from './StatusBadge.vue';

// `event` is owned by the parent so a list reload can refresh what the popup shows.
defineProps<{ event: ClassEvent | null }>();
const emit = defineEmits<{
  /** The booking went through; the parent reloads the list and refreshes `event`. */
  reserved: [id: number];
  /** The booking was rejected; the parent reloads the list. */
  rejected: [id: number];
}>();

const { t, time } = useI18n();

const show = ref(false);
const form = useTemplateRef<HTMLFormElement>('form');
const nameInput = useTemplateRef<HTMLInputElement>('nameInput');

const name = ref('');
const email = ref('');
const phone = ref('');
const validated = ref(false);
const succeeded = ref(false);
const errorMessage = ref('');
const busy = ref(false);

let bookingId: number | null = null;
let triggerEl: Element | null = null;

/** Opens the popup for `ev` with an empty form. */
function open(ev: ClassEvent): void {
  bookingId = ev.id;
  name.value = '';
  email.value = '';
  phone.value = '';
  validated.value = false;
  succeeded.value = false;
  errorMessage.value = '';
  triggerEl = document.activeElement;
  show.value = true;
}

function onShown(): void {
  nameInput.value?.focus();
}

function onHidden(): void {
  if (triggerEl instanceof HTMLElement) triggerEl.focus();
  triggerEl = null;
}

async function submit(): Promise<void> {
  errorMessage.value = '';

  if (!form.value || !form.value.checkValidity()) {
    validated.value = true;
    return;
  }
  if (bookingId === null) return;

  const id = bookingId;
  busy.value = true;
  try {
    await apiFetch<unknown>(`/api/events/${id}/reserve`, {
      method: 'POST',
      json: { name: name.value, email: email.value, phone: phone.value },
    });
    succeeded.value = true;
    emit('reserved', id);
  } catch (err) {
    errorMessage.value = errorText(err);
    emit('rejected', id);
  } finally {
    busy.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <BModal
    id="reserveModal"
    v-model="show"
    centered
    no-footer
    title-tag="h2"
    title-class="h5"
    :title="t('reserveTitle')"
    focus="r-name"
    @shown="onShown"
    @hidden="onHidden"
  >
    <div class="event-summary mb-3">
      <template v-if="event">
        <h3 class="h5 mb-1" id="modal-event-name">{{ event.name }}</h3>
        <div class="text-body-secondary small" id="modal-event-when">
          <i class="bi bi-calendar3" aria-hidden="true"></i> {{ time.longDate(event.startsAt) }} ·
          <i class="bi bi-clock" aria-hidden="true"></i> {{ time.timeRange(event.startsAt, event.endsAt) }}
        </div>
        <p class="mt-2 mb-0 event-description" :class="{ 'd-none': !event.description }" id="modal-event-description">{{ event.description }}</p>
        <div class="mt-2" id="modal-event-spots"><StatusBadge :event="event" /></div>
      </template>
    </div>

    <div class="alert alert-success" :class="{ 'd-none': !succeeded }" id="reserve-success" role="status">
      <i class="bi bi-check-circle-fill me-1" aria-hidden="true"></i><span>{{ t('reservationSuccess') }}</span>
      <button class="btn btn-primary w-100 mt-3" id="reserve-dismiss" @click="show = false">{{ t('close') }}</button>
    </div>

    <form
      ref="form"
      id="reserve-form"
      :class="{ 'was-validated': validated, 'd-none': succeeded }"
      novalidate
      @submit.prevent="submit"
    >
      <div class="mb-3">
        <label for="r-name" class="form-label">{{ t('yourName') }}</label>
        <input ref="nameInput" v-model="name" type="text" class="form-control" id="r-name" name="name" maxlength="100" autocomplete="name" required>
        <div class="invalid-feedback">{{ t('err.invalid_name') }}</div>
      </div>
      <div class="mb-3">
        <label for="r-email" class="form-label">{{ t('email') }}</label>
        <input v-model="email" type="email" class="form-control" id="r-email" name="email" maxlength="254" autocomplete="email" required>
        <div class="invalid-feedback">{{ t('err.invalid_email') }}</div>
      </div>
      <div class="mb-3">
        <label for="r-phone" class="form-label">{{ t('phone') }}</label>
        <input v-model="phone" type="tel" class="form-control" id="r-phone" name="phone" maxlength="20" autocomplete="tel" required>
        <div class="invalid-feedback">{{ t('err.invalid_phone') }}</div>
      </div>
      <div class="alert alert-danger" :class="{ 'd-none': !errorMessage }" id="reserve-error" role="alert">{{ errorMessage }}</div>
      <button type="submit" class="btn btn-primary w-100" id="reserve-submit" :disabled="busy">
        <span class="spinner-border spinner-border-sm me-1" :class="{ 'd-none': !busy }" aria-hidden="true"></span>
        <span>{{ t('confirmBooking') }}</span>
      </button>
    </form>
  </BModal>
</template>
