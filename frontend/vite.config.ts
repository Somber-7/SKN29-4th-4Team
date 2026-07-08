import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// 관리자 화면은 별도 번들(admin.html/main.admin.tsx)로 빌드한다 — 사용자 번들에
// admin 코드가 0바이트로 섞이지 않게 하기 위함(관리자페이지 개발 계획서 §2·§16.3).
// `vite build --mode admin`으로 빌드하면 base가 '/manage/'로 바뀌고 admin.html만
// 입력으로 잡아 dist/manage/ 아래에 산출물을 낸다. package.json의 "build" 스크립트가
// 사용자 빌드 → 관리자 빌드 순서로 둘 다 실행한다(순서 중요: 반대로 하면 사용자 빌드의
// emptyOutDir가 dist/manage를 지운다).

// nginx의 `try_files $uri /manage/admin.html`은 운영 빌드에서만 동작한다. Vite 개발
// 서버(`npm run dev:admin`)는 보조 HTML 엔트리에 대해 이런 SPA 폴백을 자동으로 해주지
// 않아서, `/manage/dashboard`처럼 admin.html이 아닌 경로로 새로고침하면 404가 난다.
// (참고: vite-plugin-rewrite-all은 점(.)이 포함된 경로의 폴백 문제를 고치는 패키지라
// 이 문제와는 다르다 — 별도 HTML 엔트리 폴백은 직접 미들웨어로 처리해야 한다.)
// 이 플러그인이 admin 모드의 dev 서버에서만 그 폴백을 재현한다.
function adminHtmlFallback(): Plugin {
  return {
    name: 'admin-html-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        const acceptsHtml = req.headers.accept?.includes('text/html') ?? false
        const isAsset = /\.[a-zA-Z0-9]+($|\?)/.test(url)
        const isViteInternal = url.startsWith('/@') || url.includes('/node_modules/')
        if (acceptsHtml && !isAsset && !isViteInternal && !url.endsWith('/admin.html')) {
          req.url = '/manage/admin.html'
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const isAdmin = mode === 'admin'

  return {
    plugins: [react(), tailwindcss(), ...(isAdmin ? [adminHtmlFallback()] : [])],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    base: isAdmin ? '/manage/' : '/',

    build: isAdmin
      ? {
          outDir: 'dist/manage',
          rollupOptions: {
            input: path.resolve(__dirname, 'admin.html'),
          },
        }
      : undefined,

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
  }
})
