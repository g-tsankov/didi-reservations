import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';

import { createApp } from 'vue';
import { createBootstrap } from 'bootstrap-vue-next/plugins/createBootstrap';
import PublicApp from '../../src/vue/public/PublicApp.vue';

createApp(PublicApp).use(createBootstrap()).mount('#app');
