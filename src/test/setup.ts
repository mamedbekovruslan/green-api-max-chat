import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

// Запрос без подходящего обработчика роняет тест: случайных обращений к реальной сети не будет.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
  sessionStorage.clear()
  localStorage.clear()
})
afterAll(() => server.close())
