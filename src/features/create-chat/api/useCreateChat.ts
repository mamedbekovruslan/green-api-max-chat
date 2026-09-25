import { useMutation } from '@tanstack/react-query'
import { useChatStore, type Chat } from '@/entities/chat'
import { useGreenApiClient } from '@/entities/session'
import { resolveChat } from '../model/resolveChat'

export function useCreateChat() {
  const client = useGreenApiClient()
  const upsertChat = useChatStore((state) => state.upsertChat)
  const openChat = useChatStore((state) => state.openChat)

  return useMutation({
    mutationFn: async (phone: string): Promise<Chat> => {
      const existing = useChatStore.getState().chats.find((chat) => chat.phone === phone)
      return existing ?? resolveChat(client, phone)
    },
    onSuccess: (chat) => {
      upsertChat(chat)
      openChat(chat.chatId)
    },
  })
}
