import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useChatStore, type Chat } from '@/entities/chat'
import { useChatMessages } from '@/features/chat-history'
import { useMarkChatRead } from '@/features/mark-read'
import { useConnectionStore } from '@/features/receive-messages'
import { MessageInput, useSendMessage } from '@/features/send-message'
import { formatPhone } from '@/shared/lib/phone'
import { ArrowLeftIcon, Avatar, IconButton } from '@/shared/ui'
import styles from './ChatWindow.module.css'
import { MessageList } from './MessageList'

// На сенсорных устройствах фокус в поле ввода открывает экранную клавиатуру и закрывает переписку.
function hasCoarsePointer(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
}

function ActiveChat({ chat }: { chat: Chat }) {
  const history = useChatMessages(chat.chatId)
  useMarkChatRead(chat.chatId)
  const { send, retry } = useSendMessage(chat.chatId)
  const quotaExceeded = useConnectionStore((state) => state.quotaExceeded)
  const closeChat = useChatStore((state) => state.closeChat)
  const [focusInput] = useState(() => !hasCoarsePointer())
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!focusInput) titleRef.current?.focus()
  }, [focusInput])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) closeChat()
  }

  return (
    <section className={styles.window} aria-label={`Чат с ${chat.name}`} onKeyDown={handleKeyDown}>
      <header className={styles.header}>
        <IconButton
          label="Назад к чатам"
          icon={<ArrowLeftIcon />}
          className={styles.back}
          onClick={closeChat}
        />
        <Avatar name={chat.name} seed={chat.chatId} src={chat.avatarUrl} size={40} />
        <div className={styles.headerText}>
          <h2 ref={titleRef} className={styles.name} tabIndex={-1}>
            {chat.name}
          </h2>
          {chat.phone && <p className={styles.phone}>{formatPhone(chat.phone)}</p>}
        </div>
      </header>
      <MessageList chatId={chat.chatId} chatName={chat.name} onRetry={retry} />
      {quotaExceeded && (
        <p className={styles.banner} role="status">
          Превышен лимит тарифа GREEN-API: на бесплатном тарифе доступно 3 чата в месяц. Сообщения в
          новые чаты не будут доставлены
        </p>
      )}
      <MessageInput onSend={send} disabled={!history.isSuccess} autoFocus={focusInput} />
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
