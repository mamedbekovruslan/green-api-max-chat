import { Button } from '@/shared/ui'
import styles from './CrashScreen.module.css'

export function CrashScreen() {
  return (
    <main className={styles.screen}>
      <div className={styles.card} role="alert">
        <h1 className={styles.title}>Что-то пошло не так</h1>
        <p className={styles.text}>Перезагрузите страницу — переписка сохранится в MAX</p>
        <Button onClick={() => window.location.reload()}>Перезагрузить страницу</Button>
      </div>
    </main>
  )
}
