import { delay, http, HttpResponse, type RequestHandler } from 'msw'

// Общие обработчики для всех тестов. Тест может добавить свои через server.use(...).
export const handlers: RequestHandler[] = [
  http.get('*/waInstance:idInstance/receiveNotification/:token', async () => {
    await delay('infinite')
  }),
  http.post('*/waInstance:idInstance/readChat/:token', () => HttpResponse.json({ setRead: true })),
]
