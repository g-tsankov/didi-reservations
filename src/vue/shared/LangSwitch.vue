<script setup lang="ts">
import { BDropdown } from 'bootstrap-vue-next/components/BDropdown';
import { useI18n } from '@src/useI18n';
import type { Lang } from '@src/types';

const { lang, t, setLang } = useI18n();
const langs: Lang[] = ['bg', 'en'];
</script>

<template>
  <!-- The wrapper is ours (not BDropdown's) so the classes and aria-label sit exactly where style.css expects them. -->
  <div class="dropdown lang-switch" role="group" :aria-label="t('langSwitcherLabel')">
    <BDropdown
      no-wrapper
      no-animation
      size="sm"
      :variant="null"
      toggle-class="lang-toggle"
      menu-class="dropdown-menu-end"
      role="list"
      placement="bottom-end"
      :offset="2"
      :text="lang.toUpperCase()"
    >
      <li v-for="code in langs" :key="code">
        <a
          class="dropdown-item"
          :class="{ active: lang === code }"
          :aria-current="lang === code ? 'true' : undefined"
          href="#"
          :data-lang="code"
          @click.prevent="setLang(code)"
        >{{ code.toUpperCase() }}</a>
      </li>
    </BDropdown>
  </div>
</template>
