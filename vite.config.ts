import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import postcssConfig from './postcss.config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Track the PostCSS -> Tailwind imports as config dependencies. Vite now
  // restarts its CSS pipeline when theme configuration changes during dev.
  css: { postcss: postcssConfig },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
