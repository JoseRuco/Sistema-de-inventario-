import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ✅ Permite acceso desde red local
    port: 5173,
    strictPort: true,
  },
  build: {
    // Asegurar que los archivos del public se copien correctamente
    outDir: 'dist',
    assetsDir: 'assets',
    // Generar sourcemaps para debugging
    sourcemap: false,
  },
  // El directorio public se copia automáticamente a la raíz del build
  publicDir: 'public',
})
