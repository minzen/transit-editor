/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // The default 5 s timeout is occasionally tripped by the very first test in
    // a file when module loading and the initial DOM render run together on a
    // slow or loaded machine. Raise the per-test timeout so transient import
    // costs do not flake the suite.
    testTimeout: 15000,
  },
})
