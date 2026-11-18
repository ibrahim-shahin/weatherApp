import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev and preview servers stay on localhost (Vite's default host).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
