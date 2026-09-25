export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

// Токен передаётся в пути URL, поэтому отправлять запросы можно только на хосты GREEN-API.
const ALLOWED_HOST_SUFFIXES = ['.green-api.com', '.greenapi.com']

/**
 * GREEN-API распределяет инстансы по серверам по первым 4 цифрам idInstance:
 * `3100xxxxxxxx` → `https://3100.api.green-api.com`.
 */
export function defaultApiUrl(idInstance: string): string | null {
  const match = /^(\d{4})\d*$/.exec(idInstance.trim())
  return match ? `https://${match[1]}.api.green-api.com` : null
}

export function isAllowedApiUrl(apiUrl: string): boolean {
  let url: URL
  try {
    url = new URL(apiUrl)
  } catch {
    return false
  }

  return (
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.port === '' &&
    (url.pathname === '/' || url.pathname === '') &&
    url.search === '' &&
    url.hash === '' &&
    ALLOWED_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
  )
}

/** Убирает пробелы и завершающие слэши, чтобы к URL можно было дописать путь. */
export function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '')
}
