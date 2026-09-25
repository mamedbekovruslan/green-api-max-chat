import { z } from 'zod'
import { isAllowedApiUrl } from '@/shared/api/green-api'
import { readJson, removeItem, storageKindFor, writeJson } from '@/shared/lib/storage'

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

export interface StoredSession {
  session: Session
  remember: boolean
}

export function loadSession(): StoredSession | null {
  const tabSession = readJson('session', SESSION_STORAGE_KEY, sessionSchema)
  if (tabSession) return { session: tabSession, remember: false }

  const rememberedSession = readJson('local', SESSION_STORAGE_KEY, sessionSchema)
  if (rememberedSession) return { session: rememberedSession, remember: true }

  return null
}

export function saveSession(session: Session, remember: boolean): void {
  removeItem(storageKindFor(!remember), SESSION_STORAGE_KEY)
  writeJson(storageKindFor(remember), SESSION_STORAGE_KEY, session)
}

export function clearSession(): void {
  removeItem('session', SESSION_STORAGE_KEY)
  removeItem('local', SESSION_STORAGE_KEY)
}
