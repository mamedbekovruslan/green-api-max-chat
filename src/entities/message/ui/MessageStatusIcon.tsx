import { cn } from '@/shared/lib/cn'
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from '@/shared/ui'
import type { MessageStatus } from '../model/types'
import styles from './MessageBubble.module.css'

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
}

const STATUS_ICONS = {
  pending: ClockIcon,
  sent: CheckIcon,
  delivered: DoubleCheckIcon,
  read: DoubleCheckIcon,
  failed: AlertIcon,
} satisfies Record<MessageStatus, unknown>

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  const StatusIcon = STATUS_ICONS[status]
  return (
    <span
      className={cn(styles.status, styles[`status-${status}`])}
      role="img"
      aria-label={STATUS_LABELS[status]}
      title={STATUS_LABELS[status]}
    >
      <StatusIcon />
    </span>
  )
}
