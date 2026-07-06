import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      // nginx(로컬 docker-compose, 80번 포트)로 프록시 — django/fastapi는 컨테이너 내부에만 노출되어 있어 직접 접근 불가
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/naming-api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
