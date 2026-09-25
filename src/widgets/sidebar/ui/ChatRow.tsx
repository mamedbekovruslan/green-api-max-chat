import { ChatListItem, type Chat } from '@/entities/chat'
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

  return (
    <ChatListItem
      chat={chat}
      subtitle={lastMessage?.text ?? (chat.phone ? formatPhone(chat.phone) : '')}
      time={lastMessage && formatListTime(lastMessage.timestamp)}
      active={active}
      onSelect={onSelect}
    />
  )
}
