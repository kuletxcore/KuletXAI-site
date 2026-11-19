import { defineConfig } from 'vitest/config'

/**
 * Unit tests run in plain Node: the app's Vite config pulls in the Cloudflare/Whop plugins, which swap Node built-ins
 * for Workers shims and break fs reads that the data-integrity tests rely on.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
