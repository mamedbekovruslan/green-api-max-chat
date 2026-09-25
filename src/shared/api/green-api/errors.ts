export type ApiErrorKind =
  | 'invalidConfig'
  | 'unauthorized'
  | 'notFound'
  | 'badRequest'
  | 'rateLimited'
  | 'quotaExceeded'
  | 'server'
  | 'network'
  | 'timeout'
  | 'invalidResponse'
  | 'aborted'

interface ApiErrorOptions {
  status?: number
  cause?: unknown
}

/**
 * Ошибка клиента GREEN-API.
 *
 * Сообщение строится только из `kind` и `status`. URL запроса и тело ответа сервера
 * в него не попадают: и там, и там может быть apiTokenInstance.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly kind: ApiErrorKind
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, options: ApiErrorOptions = {}) {
    const suffix = options.status === undefined ? '' : ` (HTTP ${options.status})`
    super(`GREEN-API request failed: ${kind}${suffix}`, { cause: options.cause })
    this.kind = kind
    this.status = options.status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorKindFromStatus(status: number): ApiErrorKind {
  if (status === 401 || status === 403) return 'unauthorized'
  if (status === 404) return 'notFound'
  if (status === 429) return 'rateLimited'
  if (status === 466) return 'quotaExceeded'
  if (status >= 500) return 'server'
  return 'badRequest'
}
