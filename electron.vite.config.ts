import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import { sharedConfig } from './vite.config.shared';

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: resolve('electron/main.ts'),
      },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: resolve('electron/preload.ts'),
      },
    },
  },
  renderer: {
    ...sharedConfig,
    root: '.',
    base: './',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve('index.html'),
      },
    },
    define: {
      'import.meta.env.VITE_ELECTRON': JSON.stringify('1'),
    },
  },
});
