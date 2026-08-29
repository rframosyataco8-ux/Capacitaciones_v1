import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa xlsx (~1 MB) en su propio chunk → carga lazy implícita en tree-shaking
          xlsx: ['xlsx'],
          // Separa jsPDF + autotable (~1.2 MB) de la app principal
          pdf: ['jspdf', 'jspdf-autotable'],
          // Vendor chunk con React y router
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
