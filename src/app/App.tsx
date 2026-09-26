import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useSessionStore } from '@/entities/session'
import { ChatPage } from '@/pages/chat'
import { LoginPage } from '@/pages/login'
import { ErrorBoundary } from '@/shared/ui'
import { CrashScreen } from './CrashScreen'
import { createQueryClient } from './queryClient'
import { useChatHistoryPrefetch } from './useChatHistoryPrefetch'
import { useChatsPersistence } from './useChatsPersistence'
import { useNotificationPolling } from './useNotificationPolling'

function Router() {
  useChatsPersistence()
  useChatHistoryPrefetch()
  useNotificationPolling()
  const isAuthenticated = useSessionStore((state) => state.session !== null)
  return isAuthenticated ? <ChatPage /> : <LoginPage />
}

export function App() {
  const [queryClient] = useState(createQueryClient)

  return (
    <ErrorBoundary fallback={<CrashScreen />}>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
