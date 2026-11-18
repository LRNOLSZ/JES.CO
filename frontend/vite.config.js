import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Vite 8's default oxc minifier has no drop-console option yet (esbuild's
  // `drop` is ignored once oxc is active — confirmed via a real build). Terser
  // is the documented working path. Only for the production build — several
  // call sites log real student emails and raw API error bodies with no
  // dev-only guard, which would otherwise ship straight into the live console
  // (F-18); local `vite dev` never runs the build/minify step at all, so this
  // has no effect there regardless.
  build: command === 'build' ? {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  } : {},
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` is used by scripts/prerender.mjs to serve the built site
  // locally while Playwright renders each page to static HTML. It needs the
  // SAME /api proxy that frontend/vercel.json gives the real deployed site,
  // because main.jsx deliberately leaves axios's baseURL empty in production
  // so calls stay same-origin and the Railway hostname stays masked. Without
  // this block, those same-origin calls hit the preview server itself (which
  // serves static files only), 404, and every page gets pre-rendered with an
  // EMPTY data state — which is exactly what silently shipped from
  // 2026-08-22 to 2026-11-18. See CLAUDE.md's Discoverability section.
  //
  // ⚠️ KEEP THE TARGET IN SYNC WITH frontend/vercel.json's /api rewrite.
  // Hardcoded on purpose, mirroring vercel.json rather than adding an env
  // var — a missing env var (VITE_API_URL) is what caused half this bug.
  // This block affects the local/CI preview server ONLY; it is never part of
  // the deployed output, so it has zero effect on API masking in production.
  preview: {
    proxy: {
      '/api': {
        target: 'https://web-production-ae068.up.railway.app',
        changeOrigin: true,
      },
      '/media': {
        target: 'https://web-production-ae068.up.railway.app',
        changeOrigin: true,
      },
    },
  },
}))
