import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'exoframe-client': fileURLToPath(new URL('./index.ts', import.meta.url)),
    },
  },
});
