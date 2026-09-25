import { useChatStore } from '@/entities/chat'
import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui'
import styles from './ChatWindow.module.css'
import { MessageList } from './MessageList'

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

  return (
    <section className={styles.window} aria-label={`Чат с ${chat.name}`}>
      <header className={styles.header}>
        <Avatar name={chat.name} seed={chat.chatId} src={chat.avatarUrl} size={40} />
        <div className={styles.headerText}>
          <h2 className={styles.name}>{chat.name}</h2>
          {chat.phone && <p className={styles.phone}>{formatPhone(chat.phone)}</p>}
        </div>
      </header>
      <MessageList key={chat.chatId} chatId={chat.chatId} />
    </section>
  )
}
