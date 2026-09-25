import { z } from 'zod'
import { readJson, removeItem, writeJson, type StorageKind } from '@/shared/lib/storage'
import { chatSchema, type Chat } from './types'

export const CHATS_STORAGE_KEY = 'max-chat:chats'

const storedChatsSchema = z.object({
  idInstance: z.string(),
  chats: z.array(chatSchema),
})

export function loadChats(kind: StorageKind, idInstance: string): Chat[] {
  const stored = readJson(kind, CHATS_STORAGE_KEY, storedChatsSchema)
  return stored?.idInstance === idInstance ? stored.chats : []
}

export function saveChats(kind: StorageKind, idInstance: string, chats: Chat[]): void {
  writeJson(kind, CHATS_STORAGE_KEY, { idInstance, chats })
}

export function clearChats(): void {
  removeItem('session', CHATS_STORAGE_KEY)
  removeItem('local', CHATS_STORAGE_KEY)
}
