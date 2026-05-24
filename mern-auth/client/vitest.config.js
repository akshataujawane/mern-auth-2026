import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'json', 'json-summary', 'text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/firebase.js'],
    },
  },
});
