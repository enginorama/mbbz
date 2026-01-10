import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';

import { routes } from 'vue-router/auto-routes';

import messages from '@intlify/unplugin-vue-i18n/messages';

import { createI18n } from 'vue-i18n';
import App from './App.vue';

const router = createRouter({
  history: import.meta.env.VITE_GITHUB_PAGES
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
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
