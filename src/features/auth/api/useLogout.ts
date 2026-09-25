import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSessionStore } from '@/entities/session'

export function useLogout(): () => void {
  const queryClient = useQueryClient()
  const logout = useSessionStore((state) => state.logout)

  return useCallback(() => {
    logout()
    queryClient.clear()
  }, [logout, queryClient])
}
