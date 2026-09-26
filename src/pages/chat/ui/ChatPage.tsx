import { useChatStore } from '@/entities/chat'
import { cn } from '@/shared/lib/cn'
import { ChatWindow } from '@/widgets/chat-window'
import { Sidebar } from '@/widgets/sidebar'
import styles from './ChatPage.module.css'

export function ChatPage() {
  const isChatOpen = useChatStore((state) =>
    state.chats.some((chat) => chat.chatId === state.activeChatId),
  )

  return (
    <main className={cn(styles.page, isChatOpen && styles.chatOpen)}>
      <Sidebar />
      <ChatWindow />
    </main>
  )
}
