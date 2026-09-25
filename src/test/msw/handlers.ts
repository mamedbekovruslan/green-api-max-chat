import type { RequestHandler } from 'msw'

// Общие обработчики для всех тестов. Тест может добавить свои через server.use(...).
export const handlers: RequestHandler[] = []
