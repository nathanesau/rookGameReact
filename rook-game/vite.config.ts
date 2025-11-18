import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/rookGameReact/',
  server: {
    host: true, // Listen on all addresses including LAN
    port: 5173,
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
