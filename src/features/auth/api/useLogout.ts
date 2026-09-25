import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { clearChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'

export function useLogout(): () => void {
  const queryClient = useQueryClient()
  const logout = useSessionStore((state) => state.logout)
  const resetChats = useChatStore((state) => state.reset)

  return useCallback(() => {
    logout()
    resetChats()
    clearChats()
    queryClient.clear()
  }, [logout, resetChats, queryClient])
}
