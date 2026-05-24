import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/tests/**/*.test.js'],
    setupFiles: ['api/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'client/**',
        'api/tests/**',
        'vitest.config.js'
      ],
      reportsDirectory: 'coverage',
    },
  },
});
