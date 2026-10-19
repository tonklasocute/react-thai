import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/stories/**', 'src/address/data/**', 'src/**/index.ts', 'src/**/types.ts'],
      reporter: ['text', 'text-summary', 'json-summary', 'html'],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
});
