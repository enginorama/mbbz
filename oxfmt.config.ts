import { defineConfig } from 'oxfmt';

export default defineConfig({
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  sortTailwindcss: true,
  ignorePatterns: ['typed-router.d.ts'],
});
