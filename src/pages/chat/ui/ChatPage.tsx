import { ChatWindow } from '@/widgets/chat-window'
import { Sidebar } from '@/widgets/sidebar'
import styles from './ChatPage.module.css'

export function ChatPage() {
  return (
    <main className={styles.page}>
      <Sidebar />
      <ChatWindow />
    </main>
  )
}
