<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@src/useI18n';
import type { ClassEvent } from '@src/types';
import { statusOf } from './eventStatus';

const props = defineProps<{ event: ClassEvent }>();
const { t } = useI18n();

const badge = computed<{ variant: string; text: string; ariaLabel?: string }>(() => {
  const ev = props.event;
  switch (statusOf(ev)) {
    case 'open': {
      const text = ev.spotsLeft === 1 ? t('spotsLeftOne') : t('spotsLeft', { n: ev.spotsLeft });
      return { variant: ev.spotsLeft <= 3 ? 'text-bg-warning' : 'text-bg-success', text, ariaLabel: text };
    }
    case 'full':
      return { variant: 'text-bg-secondary', text: t('full') };
    default:
      return { variant: 'text-bg-info', text: t('inProgress') };
  }
});
</script>

<template>
  <span class="badge rounded-pill" :class="badge.variant" :aria-label="badge.ariaLabel">{{ badge.text }}</span>
</template>
