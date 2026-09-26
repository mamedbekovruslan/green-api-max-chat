import { cn } from '@/shared/lib/cn'
import { Avatar, Skeleton } from '@/shared/ui'
import type { Chat } from '../model/types'
import styles from './ChatListItem.module.css'

interface ChatListItemProps {
  chat: Chat
  subtitle: string
  time?: string | undefined
  unread?: number
  loading?: boolean
  active: boolean
  onSelect: (chatId: string) => void
}

export function ChatListItem({
  chat,
  subtitle,
  time,
  unread = 0,
  loading = false,
  active,
  onSelect,
}: ChatListItemProps) {
  return (
    <button
      type="button"
      className={cn(styles.item, active && styles.active)}
      aria-current={active ? 'true' : undefined}
      aria-busy={loading || undefined}
      onClick={() => onSelect(chat.chatId)}
    >
      <Avatar name={chat.name} seed={chat.chatId} src={chat.avatarUrl} size={56} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.name}>{chat.name}</span>
          {loading ? (
            <Skeleton width={36} height={12} />
          ) : (
            time && <span className={styles.time}>{time}</span>
          )}
        </span>
        <span className={styles.bottom}>
          {loading ? (
            <Skeleton width="70%" height={14} className={styles.subtitleSkeleton} />
          ) : (
            <span className={styles.subtitle}>{subtitle}</span>
          )}
          {!loading && unread > 0 && (
            <span className={styles.badge} aria-label={`Непрочитанных: ${unread}`}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
