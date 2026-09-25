import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useSessionStore } from '@/entities/session'
import { ChatPage } from '@/pages/chat'
import { LoginPage } from '@/pages/login'
import { createQueryClient } from './queryClient'
import { useChatsPersistence } from './useChatsPersistence'
import { useNotificationPolling } from './useNotificationPolling'

function Router() {
  useChatsPersistence()
  useNotificationPolling()
  const isAuthenticated = useSessionStore((state) => state.session !== null)
  return isAuthenticated ? <ChatPage /> : <LoginPage />
}

export function App() {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  )
}
