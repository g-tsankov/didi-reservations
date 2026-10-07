<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue';
import { BModal } from 'bootstrap-vue-next/components/BModal';
import { ApiError, errorText, type ApiOptions } from '@src/api';
import { useI18n } from '@src/useI18n';
import type { EventDetails, Reservation } from '@src/types';

export type AdminApi = <T>(url: string, options?: ApiOptions) => Promise<T>;

const props = defineProps<{
  /** Fetch wrapper that also handles an expired session. */
  api: AdminApi;
}>();
const emit = defineEmits<{
  /** A class was saved, deleted or lost a sign-up; the parent reloads the list. */
  changed: [];
}>();

const { t, time } = useI18n();

const show = ref(false);
const form = useTemplateRef<HTMLFormElement>('form');

/** `{ event, reservations }` while editing; null when creating. */
const current = ref<EventDetails | null>(null);
const editing = computed(() => current.value !== null);

// Form fields are filled only on open and after a save, so a sign-up removal keeps typed values.
const name = ref('');
const description = ref('');
const startDate = ref('');
const startTime = ref('');
// A number input's v-model yields a number, or '' while the field is empty.
const duration = ref<number | string>(60);
const capacity = ref<number | string>(12);

const validated = ref(false);
const saved = ref(false);
const errorMessage = ref(''); // stored text, so a language change leaves it as shown
const saving = ref(false);
const removing = reactive(new Set<number>()); // reservation ids with a pending removal

function is401(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

function clearMessages(): void {
  errorMessage.value = '';
  saved.value = false;
}

function fillForm(): void {
  const ev = current.value?.event;
  name.value = ev ? ev.name : '';
  description.value = ev ? ev.description : '';
  const sofiaStr = ev ? time.toSofiaInput(ev.startsAt) : '';
  startDate.value = sofiaStr ? sofiaStr.split('T')[0] : '';
  startTime.value = sofiaStr ? sofiaStr.split('T')[1] : '';
  duration.value = ev ? ev.durationMinutes : 60;
  capacity.value = ev ? ev.capacity : 12;
}

/** Opens the popup for editing `details`, or for a new class when null. */
function open(details: EventDetails | null): void {
  current.value = details;
  validated.value = false;
  clearMessages();
  fillForm();
  // Bootstrap did not restore focus on close; with nothing focused, the focus trap has nothing to return to.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  show.value = true;
}

function hide(): void {
  show.value = false;
}

async function submit(): Promise<void> {
  clearMessages();

  const startsAt = time.fromSofiaInput(`${startDate.value}T${startTime.value}`);
  if (!form.value || !form.value.checkValidity()) {
    validated.value = true;
    return;
  }

  const body = {
    name: name.value,
    description: description.value,
    startsAt: startsAt as number,
    durationMinutes: Number(duration.value),
    capacity: Number(capacity.value),
  };
  const request = current.value
    ? props.api<EventDetails>(`/api/admin/events/${current.value.event.id}`, { method: 'PUT', json: body })
    : props.api<EventDetails>('/api/admin/events', { method: 'POST', json: body });

  saving.value = true;
  try {
    const data = await request;
    current.value = data;
    validated.value = false;
    fillForm();
    saved.value = true;
    emit('changed');
  } catch (err) {
    if (!is401(err)) errorMessage.value = errorText(err);
  } finally {
    saving.value = false;
  }
}

async function deleteEvent(): Promise<void> {
  if (!current.value || !window.confirm(t('admin.confirmDelete'))) return;
  try {
    await props.api<unknown>(`/api/admin/events/${current.value.event.id}`, { method: 'DELETE' });
    hide();
    emit('changed');
  } catch (err) {
    if (!is401(err)) errorMessage.value = errorText(err);
  }
}

async function removeSignup(r: Reservation): Promise<void> {
  if (!window.confirm(t('admin.confirmRemove', { name: r.name }))) return;

  removing.add(r.id);
  try {
    await props.api<unknown>(`/api/admin/reservations/${r.id}`, { method: 'DELETE' });
    const data = await props.api<EventDetails>(`/api/admin/events/${current.value!.event.id}`);
    current.value = data;
    removing.delete(r.id);
    emit('changed');
  } catch (err) {
    removing.delete(r.id);
    if (!is401(err)) errorMessage.value = errorText(err);
  }
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function bookedAt(ms: number): string {
  return time.format(ms, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

// New classes focus the name field; edits keep the default (the dialog itself), as Bootstrap did.
const focusTarget = computed(() => (editing.value ? undefined : 'e-name'));

defineExpose({ open, hide });
</script>

<template>
  <BModal
    id="eventModal"
    v-model="show"
    size="lg"
    scrollable
    no-footer
    aria-labelledby="eventModalLabel"
    aria-modal="true"
    :aria-describedby="undefined"
    :focus="focusTarget"
  >
    <template #header="{ close }">
      <h2 class="modal-title h5" id="eventModalLabel">{{ t(editing ? 'admin.editClass' : 'admin.createClass') }}</h2>
      <button type="button" class="btn-close" aria-label="Close" @click="close"></button>
    </template>

    <form ref="form" id="event-form" :class="{ 'was-validated': validated }" novalidate @submit.prevent="submit">
      <div class="row g-3">
        <div class="col-12">
          <label for="e-name" class="form-label">{{ t('admin.name') }}</label>
          <input v-model="name" type="text" class="form-control" id="e-name" maxlength="120" required>
          <div class="invalid-feedback">{{ t('err.invalid_name') }}</div>
        </div>
        <div class="col-12">
          <label for="e-description" class="form-label">{{ t('admin.description') }}</label>
          <textarea v-model="description" class="form-control" id="e-description" rows="3" maxlength="2000"></textarea>
        </div>
        <div class="col-6 col-md-3 d-flex flex-column">
          <label for="e-start-date" class="form-label flex-grow-1 d-flex align-items-end">{{ t('admin.startDate') }}</label>
          <input v-model="startDate" type="date" class="form-control" id="e-start-date" required>
          <div class="invalid-feedback">{{ t('err.invalid_start') }}</div>
        </div>
        <div class="col-6 col-md-3 d-flex flex-column">
          <label for="e-start-time" class="form-label flex-grow-1 d-flex align-items-end">{{ t('admin.startTime') }}</label>
          <input v-model="startTime" type="time" class="form-control" id="e-start-time" required>
          <div class="invalid-feedback">{{ t('err.invalid_start') }}</div>
        </div>
        <div class="col-6 col-md-3 d-flex flex-column">
          <label for="e-duration" class="form-label flex-grow-1 d-flex align-items-end">{{ t('admin.duration') }}</label>
          <input v-model="duration" type="number" class="form-control" id="e-duration" min="1" max="1440" step="1" required>
          <div class="invalid-feedback">{{ t('err.invalid_duration') }}</div>
        </div>
        <div class="col-6 col-md-3 d-flex flex-column">
          <label for="e-capacity" class="form-label flex-grow-1 d-flex align-items-end">{{ t('admin.capacity') }}</label>
          <input v-model="capacity" type="number" class="form-control" id="e-capacity" min="1" max="1000" step="1" required>
          <div class="invalid-feedback">{{ t('err.invalid_capacity') }}</div>
        </div>
      </div>

      <div class="alert alert-danger mt-3 mb-0" :class="{ 'd-none': !errorMessage }" id="event-error" role="alert">{{ errorMessage }}</div>
      <div class="alert alert-success mt-3 mb-0" :class="{ 'd-none': !saved }" id="event-saved" role="status">{{ t('admin.saved') }}</div>

      <div class="d-flex justify-content-between gap-2 mt-3">
        <button type="button" class="btn btn-outline-danger" :class="{ 'd-none': !editing }" id="delete-event" @click="deleteEvent">
          <i class="bi bi-trash" aria-hidden="true"></i> <span>{{ t('admin.deleteClass') }}</span>
        </button>
        <button type="submit" class="btn btn-primary ms-auto" id="save-event" :disabled="saving">
          <i class="bi bi-check-lg" aria-hidden="true"></i> <span>{{ t('admin.save') }}</span>
        </button>
      </div>
    </form>

    <section id="signups" class="mt-4 pt-3 border-top" :class="{ 'd-none': !editing }">
      <template v-if="current">
        <h3 class="h6 mb-3" id="signups-title">{{ t('admin.signups', { n: current.reservations.length, cap: current.event.capacity }) }}</h3>
        <p class="text-body-secondary mb-0" :class="{ 'd-none': current.reservations.length > 0 }" id="signups-empty">{{ t('admin.noSignups') }}</p>
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0" :class="{ 'd-none': current.reservations.length === 0 }" id="signups-table">
            <thead>
              <tr>
                <th>{{ t('yourName') }}</th>
                <th>{{ t('email') }}</th>
                <th>{{ t('phone') }}</th>
                <th>{{ t('admin.bookedAt') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="signups-body">
              <tr v-for="r in current.reservations" :key="r.id">
                <td>{{ r.name }}</td>
                <td><a :href="`mailto:${r.email}`">{{ r.email }}</a></td>
                <td class="text-nowrap"><a :href="telHref(r.phone)">{{ r.phone }}</a></td>
                <td class="small text-body-secondary text-nowrap">{{ bookedAt(r.createdAt) }}</td>
                <td class="text-end">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger remove-signup"
                    :data-id="r.id"
                    :data-name="r.name"
                    :title="t('admin.remove')"
                    :aria-label="t('admin.remove')"
                    :disabled="removing.has(r.id)"
                    @click="removeSignup(r)"
                  ><i class="bi bi-x-lg" aria-hidden="true"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </BModal>
</template>
