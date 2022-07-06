import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // increased timeouts for slower CI runners
    testTimeout: 120000,
    hookTimeout: 120000,
    // run in single threaded mode to prevent container conflicts during tests
    threads: false,
  },
});
