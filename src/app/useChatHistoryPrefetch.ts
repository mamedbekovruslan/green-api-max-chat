import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { prefetchChatHistories } from '@/features/chat-history'
import { createGreenApiClient } from '@/shared/api/green-api'

export function useChatHistoryPrefetch(): void {
  const credentials = useSessionStore((state) => state.session?.credentials)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!credentials) return

    const controller = new AbortController()
    void prefetchChatHistories({
      queryClient,
      client: createGreenApiClient(credentials),
      idInstance: credentials.idInstance,
      chatIds: useChatStore.getState().chats.map((chat) => chat.chatId),
      signal: controller.signal,
    })
    return () => controller.abort()
  }, [credentials, queryClient])
}
