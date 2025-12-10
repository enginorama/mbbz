import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import VueRouter from 'unplugin-vue-router/vite';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    VueRouter(),
    vue(),
    tailwindcss(),
    vueDevTools(),
    VueI18nPlugin({ include: [path.resolve(__dirname, './src/locales/**')] }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
