import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { formatTime } from '../lib/formatDate'
import type { Message } from '../model/types'
import styles from './MessageBubble.module.css'
import { MessageStatusIcon } from './MessageStatusIcon'

interface MessageBubbleProps {
  message: Message
  footer?: ReactNode
}

export function MessageBubble({ message, footer }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing'

  return (
    <div className={cn(styles.row, outgoing ? styles.rowOutgoing : styles.rowIncoming)}>
      <div className={cn(styles.bubble, outgoing ? styles.outgoing : styles.incoming)}>
        <p className={styles.text}>{message.text}</p>
        <span className={styles.meta}>
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
          {outgoing && message.status && <MessageStatusIcon status={message.status} />}
        </span>
      </div>
      {footer}
    </div>
  )
}
