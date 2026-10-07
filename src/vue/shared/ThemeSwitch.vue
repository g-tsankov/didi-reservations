<script setup lang="ts">
import { computed } from 'vue';
import { BDropdown } from 'bootstrap-vue-next/components/BDropdown';
import { useI18n } from '@src/useI18n';
import { useTheme } from '@src/useTheme';
import type { ThemeValue, TranslationKey } from '@src/types';

const { t } = useI18n();
const { theme, setTheme } = useTheme();

const options: { value: ThemeValue; icon: string; label: TranslationKey }[] = [
  { value: 'dark', icon: 'bi-moon-stars-fill', label: 'themeDark' },
  { value: 'light', icon: 'bi-sun-fill', label: 'themeLight' },
];

const toggleIcon = computed(() => (theme.value === 'light' ? 'bi-sun-fill' : 'bi-moon-stars-fill'));
</script>

<template>
  <!-- The wrapper is ours (not BDropdown's) so the classes and aria-label sit exactly where style.css expects them. -->
  <div class="dropdown theme-switch" role="group" :aria-label="t('themeSwitcherLabel')">
    <BDropdown
      no-wrapper
      no-animation
      size="sm"
      :variant="null"
      toggle-class="theme-toggle"
      menu-class="dropdown-menu-end"
      role="list"
      placement="bottom-end"
      :offset="2"
    >
      <template #button-content>
        <i class="bi" :class="toggleIcon" aria-hidden="true"></i>
      </template>
      <li v-for="opt in options" :key="opt.value">
        <a
          class="dropdown-item"
          :class="{ active: theme === opt.value }"
          :aria-current="theme === opt.value ? 'true' : undefined"
          href="#"
          :data-theme-btn="opt.value"
          @click.prevent="setTheme(opt.value)"
        ><i class="bi me-2" :class="opt.icon" aria-hidden="true"></i><span>{{ t(opt.label) }}</span></a>
      </li>
    </BDropdown>
  </div>
</template>
