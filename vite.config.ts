import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' https://i.oneme.ru",
  'connect-src https://*.green-api.com https://*.greenapi.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// CSP только для сборки: dev-сервер Vite для горячей перезагрузки использует встроенные скрипты.
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  }
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: {
      modules: { classNameStrategy: 'non-scoped' },
    },
    restoreMocks: true,
  },
})
