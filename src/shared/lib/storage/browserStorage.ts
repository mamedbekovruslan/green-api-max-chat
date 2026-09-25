import type { z } from 'zod'

export type StorageKind = 'session' | 'local'

function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

export function readJson<T>(kind: StorageKind, key: string, schema: z.ZodType<T>): T | null {
  try {
    const raw = getStorage(kind)?.getItem(key)
    if (raw == null) return null
    const result = schema.safeParse(JSON.parse(raw))
    if (result.success) return result.data
  } catch {
    // Повреждённый JSON обрабатывается так же, как невалидные данные ниже.
  }
  removeItem(kind, key)
  return null
}

export function writeJson(kind: StorageKind, key: string, value: unknown): void {
  try {
    getStorage(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    // Хранилище недоступно (приватный режим, квота) — данные живут только в памяти.
  }
}

export function removeItem(kind: StorageKind, key: string): void {
  try {
    getStorage(kind)?.removeItem(key)
  } catch {
    // Хранилище недоступно — удалять нечего.
  }
}

export function storageKindFor(remember: boolean): StorageKind {
  return remember ? 'local' : 'session'
}
