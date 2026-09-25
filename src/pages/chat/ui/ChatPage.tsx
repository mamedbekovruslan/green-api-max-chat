import { useSessionStore } from '@/entities/session'
import { useLogout } from '@/features/auth'
import { phoneFromWid } from '@/shared/lib/phone'
import { Button } from '@/shared/ui'
import styles from './ChatPage.module.css'

export function ChatPage() {
  const wid = useSessionStore((state) => state.session?.wid)
  const logout = useLogout()

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Вы вошли</h1>
      {wid && <p className={styles.account}>Аккаунт MAX: {phoneFromWid(wid)}</p>}
      <p className={styles.note}>Интерфейс чата появится на следующем этапе</p>
      <Button variant="secondary" onClick={logout}>
        Выйти
      </Button>
    </main>
  )
}
