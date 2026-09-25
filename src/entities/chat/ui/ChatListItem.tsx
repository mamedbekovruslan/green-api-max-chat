import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui'
import type { Chat } from '../model/types'
import styles from './ChatListItem.module.css'

interface ChatListItemProps {
  chat: Chat
  subtitle: string
  active: boolean
  onSelect: (chatId: string) => void
}

export function ChatListItem({ chat, subtitle, active, onSelect }: ChatListItemProps) {
  return (
    <button
      type="button"
      className={cn(styles.item, active && styles.active)}
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelect(chat.chatId)}
    >
      <Avatar name={chat.name} seed={chat.chatId} src={chat.avatarUrl} size={56} />
      <span className={styles.body}>
        <span className={styles.name}>{chat.name}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>
    </button>
  )
}
