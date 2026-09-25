import { ChatListItem, useChatStore, type Chat } from '@/entities/chat'
import { formatListTime } from '@/entities/message'
import { useCachedMessages } from '@/features/chat-history'
import { formatPhone } from '@/shared/lib/phone'

interface ChatRowProps {
  chat: Chat
  active: boolean
  onSelect: (chatId: string) => void
}

export function ChatRow({ chat, active, onSelect }: ChatRowProps) {
  const lastMessage = useCachedMessages(chat.chatId)?.at(-1)
  const preview = useChatStore((state) => state.previews[chat.chatId])
  const unread = useChatStore((state) => state.unread[chat.chatId] ?? 0)
  const last = lastMessage ?? preview

  return (
    <ChatListItem
      chat={chat}
      subtitle={last?.text ?? (chat.phone ? formatPhone(chat.phone) : '')}
      time={last && formatListTime(last.timestamp)}
      unread={unread}
      active={active}
      onSelect={onSelect}
    />
  )
}
