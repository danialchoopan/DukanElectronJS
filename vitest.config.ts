import { defineConfig } from 'vitest/config'

// Vitest config: globals=true allows using describe/it/expect without imports.
// All test files live under tests/ with .test.ts extension.
export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
  },
})
