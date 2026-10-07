import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';

import { createApp } from 'vue';
import { createBootstrap } from 'bootstrap-vue-next/plugins/createBootstrap';
import AdminApp from '../../src/vue/admin/AdminApp.vue';

createApp(AdminApp).use(createBootstrap()).mount('#app');
