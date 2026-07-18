/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // team server (src/server.mjs) — live Workday deck + Daytona apply pipeline
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    // the Express server serves the PWA from repo-root web/ — this build is that frontend
    outDir: '../web',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
