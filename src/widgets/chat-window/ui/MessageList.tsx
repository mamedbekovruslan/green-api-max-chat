import { useLayoutEffect, useRef } from 'react'
import { DaySeparator, groupByDay, MessageBubble, type Message } from '@/entities/message'
import { useChatMessages } from '@/features/chat-history'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui'
import styles from './MessageList.module.css'

interface MessageListProps {
  chatId: string
  chatName: string
  onRetry: (message: Message) => void
}

export function MessageList({ chatId, chatName, onRetry }: MessageListProps) {
  const { data: messages, error, isPending, isError, refetch, isFetching } = useChatMessages(chatId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  if (isPending) {
    return (
      <p className={styles.notice} role="status">
        Загрузка сообщений…
      </p>
    )
  }

  if (isError) {
    return (
      <div className={styles.notice} role="alert">
        <p>Не удалось загрузить историю. {getErrorMessage(error)}</p>
        <Button variant="secondary" loading={isFetching} onClick={() => void refetch()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <p className={styles.notice} role="status">
        Сообщений пока нет. Напишите первым!
      </p>
    )
  }

  return (
    <div ref={scrollRef} className={styles.scroll}>
      <div className={styles.feed} role="log" aria-label="Сообщения" aria-live="polite">
        {groupByDay(messages).map((item) =>
          item.type === 'day' ? (
            <DaySeparator key={item.key} label={item.label} />
          ) : (
            <MessageBubble
              key={item.key}
              message={item.message}
              author={item.message.direction === 'outgoing' ? 'Вы' : chatName}
              footer={
                item.message.status === 'failed' && (
                  <p className={styles.failure}>
                    {item.message.failureReason ?? 'Не удалось отправить'}
                    {' · '}
                    <button
                      type="button"
                      className={styles.retry}
                      onClick={() => onRetry(item.message)}
                    >
                      Повторить
                    </button>
                  </p>
                )
              }
            />
          ),
        )}
      </div>
    </div>
  )
}
