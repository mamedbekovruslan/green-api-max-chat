import { skipToken, useQuery } from '@tanstack/react-query'
import { messagesQueryKey, type Message } from '@/entities/message'
import { useSessionStore } from '@/entities/session'

export function useCachedMessages(chatId: string): Message[] | undefined {
  const idInstance = useSessionStore((state) => state.session?.credentials.idInstance ?? '')
  const { data } = useQuery<Message[]>({
    queryKey: messagesQueryKey(idInstance, chatId),
    queryFn: skipToken,
  })
  return data
}
