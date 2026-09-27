import { queryOptions } from '@tanstack/react-query'
import { useChatStore } from '@/entities/chat'
import { historyToMessages, messagesQueryKey } from '@/entities/message'
import { isApiError, type GreenApiClient, type HistoryMessage } from '@/shared/api/green-api'

export const HISTORY_RATE_LIMIT_RETRIES = 3
export const HISTORY_RETRY_DELAY_MS = 1500

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function getHistoryWithRetry(
  client: GreenApiClient,
  chatId: string,
): Promise<HistoryMessage[]> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await client.getChatHistory(chatId)
    } catch (error) {
      const rateLimited = isApiError(error) && error.kind === 'rateLimited'
      if (!rateLimited || attempt >= HISTORY_RATE_LIMIT_RETRIES) throw error
      await wait(HISTORY_RETRY_DELAY_MS)
    }
  }
}

export function chatMessagesQuery(client: GreenApiClient, idInstance: string, chatId: string) {
  return queryOptions({
    queryKey: messagesQueryKey(idInstance, chatId),
    queryFn: async () => {
      const history = await getHistoryWithRetry(client, chatId)
      useChatStore.getState().setUnread(chatId, history.filter((item) => item.unread).length)
      return historyToMessages(chatId, history)
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
