<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@src/useI18n';
import type { ClassEvent } from '@src/types';
import StatusBadge from './StatusBadge.vue';
import { statusOf } from './eventStatus';

const props = defineProps<{ event: ClassEvent }>();
const emit = defineEmits<{ open: [id: number] }>();
const { t, time } = useI18n();

const status = computed(() => statusOf(props.event));
const bookable = computed(() => status.value === 'open');

function open(): void {
  if (bookable.value) emit('open', props.event.id);
}

function onKeydown(e: KeyboardEvent): void {
  if (!bookable.value) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('open', props.event.id);
  }
}
</script>

<template>
  <div class="col">
    <div
      class="card h-100 event-card"
      :class="bookable ? 'is-bookable' : 'is-unavailable'"
      :data-id="event.id"
      :role="bookable ? 'button' : undefined"
      :tabindex="bookable ? 0 : undefined"
      :aria-disabled="bookable ? undefined : 'true'"
      @click="open"
      @keydown="onKeydown"
    >
      <div class="card-body d-flex gap-3">
        <div class="event-date">
          <span class="event-day">{{ time.format(event.startsAt, { day: 'numeric' }) }}</span>
          <span class="event-month">{{ time.format(event.startsAt, { month: 'short' }) }}</span>
        </div>
        <div class="flex-grow-1 min-w-0">
          <h3 class="h5 card-title mb-1">{{ event.name }}</h3>
          <div class="small text-body-secondary mb-1">
            <i class="bi bi-calendar3" aria-hidden="true"></i> {{ time.format(event.startsAt, { weekday: 'long' }) }}
          </div>
          <div class="small text-body-secondary mb-2">
            <i class="bi bi-clock" aria-hidden="true"></i> {{ time.timeRange(event.startsAt, event.endsAt) }} · {{ t('duration', { n: event.durationMinutes }) }}
          </div>
          <StatusBadge :event="event" />
        </div>
      </div>
      <div v-if="bookable" class="card-footer">{{ t('bookNow') }} <i class="bi bi-arrow-right" aria-hidden="true"></i></div>
      <div v-else class="card-footer">{{ status === 'full' ? t('fullLabel') : t('pastClass') }}</div>
    </div>
  </div>
</template>
