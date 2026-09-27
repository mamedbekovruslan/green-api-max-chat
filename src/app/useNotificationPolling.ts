import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSessionStore } from '@/entities/session'
import { useLogout } from '@/features/auth'
import {
  applyNotification,
  startNotificationPolling,
  useConnectionStore,
} from '@/features/receive-messages'
import { createGreenApiClient } from '@/shared/api/green-api'

export function useNotificationPolling(): void {
  const credentials = useSessionStore((state) => state.session?.credentials)
  const queryClient = useQueryClient()
  const logout = useLogout()
  const logoutRef = useRef(logout)

  useEffect(() => {
    logoutRef.current = logout
  })

  useEffect(() => {
    if (!credentials) return

    const connection = useConnectionStore.getState()
    connection.reset()
    const context = {
      queryClient,
      idInstance: credentials.idInstance,
      seenMessageIds: new Set<string>(),
      onQuotaExceeded: connection.setQuotaExceeded,
    }
    return startNotificationPolling({
      client: createGreenApiClient(credentials),
      onNotification: (notification) => applyNotification(notification, context),
      onUnauthorized: () => logoutRef.current(),
      onStatusChange: connection.setStatus,
    })
  }, [credentials, queryClient])
}
