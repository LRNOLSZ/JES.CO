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
}))
