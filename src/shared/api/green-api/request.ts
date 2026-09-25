import type { z } from 'zod'
import { isAllowedApiUrl, normalizeApiUrl, type Credentials } from './credentials'
import { ApiError, errorKindFromStatus } from './errors'

export const DEFAULT_TIMEOUT_MS = 15_000

type HttpMethod = 'GET' | 'POST' | 'DELETE'

export interface RequestOptions<T> {
  /** Название метода GREEN-API, например `sendMessage`. */
  method: string
  httpMethod?: HttpMethod
  /** Дополнительный сегмент пути после токена, например receiptId для deleteNotification. */
  pathParam?: string | number
  query?: Record<string, string | number>
  body?: unknown
  schema: z.ZodType<T>
  timeoutMs?: number
  signal?: AbortSignal
}

export function buildUrl(
  credentials: Credentials,
  method: string,
  pathParam?: string | number,
  query?: Record<string, string | number>,
): string {
  const base = normalizeApiUrl(credentials.apiUrl)
  const id = encodeURIComponent(credentials.idInstance)
  const token = encodeURIComponent(credentials.apiTokenInstance)
  const param = pathParam === undefined ? '' : `/${encodeURIComponent(String(pathParam))}`
  const url = new URL(`${base}/waInstance${id}/${encodeURIComponent(method)}/${token}${param}`)

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export async function greenApiRequest<T>(
  credentials: Credentials,
  options: RequestOptions<T>,
): Promise<T> {
  if (!isAllowedApiUrl(normalizeApiUrl(credentials.apiUrl))) {
    throw new ApiError('invalidConfig')
  }

  const { signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  if (externalSignal?.aborted) throw new ApiError('aborted')

  // Собственный контроллер вместо AbortSignal.any/timeout: так таймаут можно отличить
  // от отмены вызывающим кодом, и он работает с fake timers в тестах.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onExternalAbort = () => controller.abort()
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true })

  try {
    const hasBody = options.body !== undefined
    const init: RequestInit = {
      method: options.httpMethod ?? (hasBody ? 'POST' : 'GET'),
      signal: controller.signal,
    }
    if (hasBody) {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = JSON.stringify(options.body)
    }

    const response = await fetch(
      buildUrl(credentials, options.method, options.pathParam, options.query),
      init,
    )

    // Тело ошибочного ответа не читаем: GREEN-API возвращает в нём путь запроса вместе с токеном.
    if (!response.ok) {
      throw new ApiError(errorKindFromStatus(response.status), { status: response.status })
    }

    const text = await response.text()
    return parseBody(text, options.schema, response.status)
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (timedOut) throw new ApiError('timeout')
    if (externalSignal?.aborted) throw new ApiError('aborted')
    // Сетевые ошибки не несут полезных деталей и могут содержать URL — причину не сохраняем.
    throw new ApiError('network')
  } finally {
    clearTimeout(timer)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }
}

function parseBody<T>(text: string, schema: z.ZodType<T>, status: number): T {
  let data: unknown = null
  if (text.trim() !== '') {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError('invalidResponse', { status })
    }
  }

  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('invalidResponse', { status, cause: result.error })
  }
  return result.data
}
