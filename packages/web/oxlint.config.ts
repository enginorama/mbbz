import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'import', 'node', 'vue', 'vitest', 'promise'],
  options: {
    typeAware: true,
  },
  rules: {
    'unbound-method': 'off',
  },
});
