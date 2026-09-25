import { useEffect } from 'react'
import { loadChats, saveChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { storageKindFor } from '@/shared/lib/storage'

export function useChatsPersistence(): void {
  const idInstance = useSessionStore((state) => state.session?.credentials.idInstance)
  const remember = useSessionStore((state) => state.remember)

  useEffect(() => {
    if (!idInstance) return

    const kind = storageKindFor(remember)
    useChatStore.getState().setChats(loadChats(kind, idInstance))

    return useChatStore.subscribe((state, previous) => {
      if (state.chats !== previous.chats) saveChats(kind, idInstance, state.chats)
    })
  }, [idInstance, remember])
}
