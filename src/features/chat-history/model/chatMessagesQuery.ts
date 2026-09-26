import { queryOptions } from '@tanstack/react-query'
import { useChatStore } from '@/entities/chat'
import { historyToMessages, messagesQueryKey } from '@/entities/message'
import type { GreenApiClient } from '@/shared/api/green-api'

export function chatMessagesQuery(client: GreenApiClient, idInstance: string, chatId: string) {
  return queryOptions({
    queryKey: messagesQueryKey(idInstance, chatId),
    queryFn: async () => {
      const history = await client.getChatHistory(chatId)
      useChatStore.getState().setUnread(chatId, history.filter((item) => item.unread).length)
      return historyToMessages(chatId, history)
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
