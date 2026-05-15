import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
      include: [
        'src/features/**/domain/**/*.ts',
        'src/features/**/hooks/**/*.ts',
        'src/lib/storage/**/*.ts',
      ],
    },
  },
})
