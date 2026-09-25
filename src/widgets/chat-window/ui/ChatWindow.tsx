import { useChatStore, type Chat } from '@/entities/chat'
import { useChatMessages } from '@/features/chat-history'
import { MessageInput, useSendMessage } from '@/features/send-message'
import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui'
import styles from './ChatWindow.module.css'
import { MessageList } from './MessageList'

function ActiveChat({ chat }: { chat: Chat }) {
  const history = useChatMessages(chat.chatId)
  const { send, retry } = useSendMessage(chat.chatId)

  return (
    <section className={styles.window} aria-label={`Чат с ${chat.name}`}>
      <header className={styles.header}>
        <Avatar name={chat.name} seed={chat.chatId} src={chat.avatarUrl} size={40} />
        <div className={styles.headerText}>
          <h2 className={styles.name}>{chat.name}</h2>
          {chat.phone && <p className={styles.phone}>{formatPhone(chat.phone)}</p>}
        </div>
      </header>
      <MessageList chatId={chat.chatId} onRetry={retry} />
      <MessageInput onSend={send} disabled={!history.isSuccess} />
    </section>
  )
}

export function ChatWindow() {
  const chat = useChatStore((state) =>
    state.chats.find((item) => item.chatId === state.activeChatId),
  )

  if (!chat) {
    return (
      <section className={styles.window} aria-label="Окно чата">
        <p className={styles.placeholder}>Выберите чат или создайте новый</p>
      </section>
    )
  }

  return <ActiveChat key={chat.chatId} chat={chat} />
}
