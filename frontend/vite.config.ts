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
      // Django (인증·마이페이지·인사이트·관리자)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // FastAPI + Neo4j (작명 생성·채팅)
      '/naming-api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
