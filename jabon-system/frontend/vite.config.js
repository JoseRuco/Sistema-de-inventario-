import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ✅ Permite acceso desde red local
    port: 5173,
    strictPort: true,
  }
})
