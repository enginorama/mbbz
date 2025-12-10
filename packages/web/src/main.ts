import './styles/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

import { routes } from 'vue-router/auto-routes';

import messages from '@intlify/unplugin-vue-i18n/messages';

import App from './App.vue';
import { createI18n } from 'vue-i18n';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const i18n = createI18n({
  locale: 'en',
  messages,
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount('#app');
