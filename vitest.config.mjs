import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{js,mjs,ts}'],
    env: { NEXT_PUBLIC_BASE_URL: '/crama', AI_CREDENTIALS_SECRET: 'test-secret-for-vitest' },
  },
});
