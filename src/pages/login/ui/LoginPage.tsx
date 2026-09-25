import { LoginForm } from '@/features/auth'
import { Logo } from '@/shared/ui'
import styles from './LoginPage.module.css'

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <header className={styles.header}>
          <Logo size={64} />
          <h1 id="login-title" className={styles.title}>
            Вход в MAX Chat
          </h1>
          <p className={styles.subtitle}>Введите данные инстанса из личного кабинета GREEN-API</p>
        </header>
        <LoginForm />
      </section>
    </main>
  )
}
