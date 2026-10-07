<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useI18n } from '@src/useI18n';
import { countOnboardingVisit, DISMISSED_KEY } from '@src/onboarding';

const { t } = useI18n();
const tip = useTemplateRef<HTMLElement>('tip');

// Decided once per page load.
const eligible = countOnboardingVisit();
const visible = ref(eligible);

function dismiss(): void {
  try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* storage unavailable */ }
  visible.value = false;
}

// Any click outside the tip hides it for this page load.
function onDocumentClick(e: MouseEvent): void {
  if (!visible.value) return;
  if (!(e.target instanceof Node) || !tip.value?.contains(e.target)) visible.value = false;
}

onMounted(() => {
  if (eligible) document.addEventListener('click', onDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <span class="onboarding-anchor">
    <div
      id="onboarding-tip"
      ref="tip"
      class="onboarding-tip"
      :class="{ 'd-none': !visible }"
      role="status"
      aria-live="polite"
    >
      <p class="onboarding-tip-text mb-2">{{ t('onboardingTip') }}</p>
      <button type="button" id="onboarding-dismiss" class="btn btn-sm btn-outline-secondary" @click="dismiss">{{ t('onboardingDismiss') }}</button>
    </div>
  </span>
</template>
