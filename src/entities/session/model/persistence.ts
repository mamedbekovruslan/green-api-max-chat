import { z } from 'zod'
import { isAllowedApiUrl } from '@/shared/api/green-api'

export const SESSION_STORAGE_KEY = 'max-chat:session'

const sessionSchema = z.object({
  credentials: z.object({
    apiUrl: z.string().refine(isAllowedApiUrl),
    idInstance: z.string().min(1),
    apiTokenInstance: z.string().min(1),
  }),
  wid: z.string().optional(),
})

export type Session = z.infer<typeof sessionSchema>

type StorageName = 'localStorage' | 'sessionStorage'

function getStorage(name: StorageName): Storage | null {
  try {
    return window[name]
  } catch {
    return null
  }
}

function readFrom(name: StorageName): Session | null {
  const storage = getStorage(name)
  try {
    const raw = storage?.getItem(SESSION_STORAGE_KEY)
    if (raw == null) return null
    const result = sessionSchema.safeParse(JSON.parse(raw))
    if (result.success) return result.data
  } catch {
    // Повреждённый JSON обрабатывается так же, как невалидная сессия ниже.
  }
  removeFrom(name)
  return null
}

function removeFrom(name: StorageName): void {
  try {
    getStorage(name)?.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Хранилище недоступно — удалять нечего.
  }
}

export function loadSession(): Session | null {
  return readFrom('sessionStorage') ?? readFrom('localStorage')
}

export function saveSession(session: Session, remember: boolean): void {
  const target: StorageName = remember ? 'localStorage' : 'sessionStorage'
  removeFrom(remember ? 'sessionStorage' : 'localStorage')
  try {
    getStorage(target)?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Хранилище недоступно (приватный режим, квота) — сессия живёт только в памяти.
  }
}

export function clearSession(): void {
  removeFrom('sessionStorage')
  removeFrom('localStorage')
}
