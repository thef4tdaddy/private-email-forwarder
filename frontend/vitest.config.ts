import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte({ hot: false }), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTest.ts'],
    globals: true,
  },
  resolve: {
    conditions: ['browser'],
  },
});
