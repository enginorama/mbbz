import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { networkInterfaces } from 'node:os';
import { fileURLToPath, URL } from 'node:url';
import type { UserConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import VueRouter from 'vue-router/vite';

// Tauri expects a fixed, host-bound dev server so the webview's HMR
// websocket can reach it (see the official create-tauri-app vite template).
function getLocalIPv4(): string {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const addr of addresses ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return 'localhost';
}

const host = process.env.TAURI_DEV_HOST || getLocalIPv4();

export const sharedConfig: UserConfig = {
  plugins: [
    VueRouter({ dts: 'src/typed-router.d.ts', exclude: ['**/components/**'] }),
    vue(),
    tailwindcss(),
    vueDevTools(),
    VueI18nPlugin({ include: ['./src/locales/**'] }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: host || '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: host || 'localhost',
      port: 5173,
    },
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
};
