import { useMutation } from '@tanstack/react-query'
import { useLayoutEffect } from 'react'
import { useChatStore } from '@/entities/chat'
import { useGreenApiClient } from '@/entities/session'

export function useMarkChatRead(chatId: string): void {
  const client = useGreenApiClient()
  const unread = useChatStore((state) => state.unread[chatId] ?? 0)
  const { mutate } = useMutation({ mutationFn: (id: string) => client.readChat(id) })

  useLayoutEffect(() => {
    const chats = useChatStore.getState()
    if (!chats.unread[chatId]) return
    chats.setUnread(chatId, 0)
    mutate(chatId)
  }, [chatId, unread, mutate])
}
