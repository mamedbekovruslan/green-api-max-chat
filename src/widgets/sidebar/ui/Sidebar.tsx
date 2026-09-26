import { useEffect, useRef, useState } from 'react'
import { filterChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { useLogout } from '@/features/auth'
import { NewChatForm } from '@/features/create-chat'
import { useConnectionStore } from '@/features/receive-messages'
import { cn } from '@/shared/lib/cn'
import { phoneFromWid } from '@/shared/lib/phone'
import { ConfirmDialog, IconButton, LogoutIcon, PlusIcon, SearchIcon } from '@/shared/ui'
import { ChatRow } from './ChatRow'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const [isCreating, setIsCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false)
  const chats = useChatStore((state) => state.chats)
  const activeChatId = useChatStore((state) => state.activeChatId)
  const openChat = useChatStore((state) => state.openChat)
  const wid = useSessionStore((state) => state.session?.wid)
  const isReconnecting = useConnectionStore((state) => state.status === 'reconnecting')
  const logout = useLogout()
  const listRef = useRef<HTMLUListElement>(null)
  const previousActiveChatId = useRef(activeChatId)

  useEffect(() => {
    const closedChatId = previousActiveChatId.current
    previousActiveChatId.current = activeChatId
    if (closedChatId === null || activeChatId !== null) return

    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-chat-id]') ?? []
    Array.from(rows)
      .find((row) => row.dataset.chatId === closedChatId)
      ?.focus()
  }, [activeChatId])

  const visibleChats = filterChats(chats, query)

  return (
    <aside className={styles.sidebar}>
      {isCreating ? (
        <NewChatForm onClose={() => setIsCreating(false)} />
      ) : (
        <>
          <header className={styles.header}>
            <h1
              className={cn(styles.title, isReconnecting && styles.reconnecting)}
              aria-live="polite"
            >
              {isReconnecting ? 'Соединение…' : 'Чаты'}
            </h1>
            <IconButton
              label="Новый чат"
              icon={<PlusIcon />}
              variant="accent"
              onClick={() => setIsCreating(true)}
            />
          </header>
          <div className={styles.search}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Найти"
              aria-label="Поиск по чатам"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {chats.length === 0 ? (
            <p className={styles.empty}>Чатов пока нет. Нажмите «+», чтобы начать переписку</p>
          ) : visibleChats.length === 0 ? (
            <p className={styles.empty}>Ничего не найдено</p>
          ) : (
            <ul ref={listRef} className={styles.list} aria-label="Список чатов">
              {visibleChats.map((chat) => (
                <li key={chat.chatId}>
                  <ChatRow chat={chat} active={chat.chatId === activeChatId} onSelect={openChat} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <footer className={styles.footer}>
        <span className={styles.account}>{wid ? phoneFromWid(wid) : 'Аккаунт MAX'}</span>
        <IconButton
          label="Выйти"
          icon={<LogoutIcon />}
          onClick={() => setIsConfirmingLogout(true)}
        />
      </footer>
      <ConfirmDialog
        open={isConfirmingLogout}
        title="Выйти из аккаунта?"
        description="Список чатов будет удалён из этого браузера. Переписка останется в MAX"
        confirmLabel="Да"
        cancelLabel="Нет"
        onConfirm={logout}
        onCancel={() => setIsConfirmingLogout(false)}
      />
    </aside>
  )
}
