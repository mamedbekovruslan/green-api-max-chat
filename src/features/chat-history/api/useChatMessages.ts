import { useQuery } from '@tanstack/react-query'
import { historyToMessages, messagesQueryKey } from '@/entities/message'
import { useGreenApiClient, useSessionStore } from '@/entities/session'

export function useChatMessages(chatId: string) {
  const client = useGreenApiClient()
  const idInstance = useSessionStore((state) => state.session?.credentials.idInstance ?? '')

  return useQuery({
    queryKey: messagesQueryKey(idInstance, chatId),
    queryFn: async ({ signal }) =>
      historyToMessages(chatId, await client.getChatHistory(chatId, { signal })),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
