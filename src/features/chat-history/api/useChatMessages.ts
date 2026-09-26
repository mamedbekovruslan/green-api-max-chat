import { useQuery } from '@tanstack/react-query'
import { useGreenApiClient, useSessionStore } from '@/entities/session'
import { chatMessagesQuery } from '../model/chatMessagesQuery'

export function useChatMessages(chatId: string) {
  const client = useGreenApiClient()
  const idInstance = useSessionStore((state) => state.session?.credentials.idInstance ?? '')

  return useQuery(chatMessagesQuery(client, idInstance, chatId))
}
