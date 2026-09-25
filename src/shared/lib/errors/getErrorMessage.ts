import { isApiError, type ApiErrorKind } from '@/shared/api/green-api'
import { UserFacingError } from './userFacingError'

const API_ERROR_MESSAGES: Record<ApiErrorKind, string> = {
  invalidConfig: 'Адрес API должен быть вида https://1234.api.green-api.com',
  unauthorized: 'Неверный idInstance или apiTokenInstance',
  notFound: 'Инстанс не найден. Проверьте idInstance и адрес API',
  badRequest: 'Сервер отклонил запрос',
  rateLimited: 'Слишком много запросов. Подождите немного и попробуйте снова',
  quotaExceeded: 'Превышен лимит тарифа GREEN-API: на бесплатном тарифе доступно 3 чата в месяц',
  server: 'Сервис GREEN-API временно недоступен',
  network: 'Нет соединения с сервером GREEN-API',
  timeout: 'Сервер GREEN-API не отвечает',
  invalidResponse: 'Сервер вернул неожиданный ответ',
  aborted: 'Запрос отменён',
}

export const FALLBACK_ERROR_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз'

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return API_ERROR_MESSAGES[error.kind]
  if (error instanceof UserFacingError) return error.message
  return FALLBACK_ERROR_MESSAGE
}
